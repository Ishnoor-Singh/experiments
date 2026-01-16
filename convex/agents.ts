"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Agent result type matching the frontend types
interface AgentResult {
  chatMessage: string;
  fileOps: Array<{
    type: "create" | "update" | "delete";
    path: string;
    content?: string;
  }>;
  schemaOps: Array<{
    type: "createTable" | "addField" | "removeField" | "deleteTable";
    tableName: string;
    fields?: Array<{
      name: string;
      type: string;
      required: boolean;
      relationTo?: string;
    }>;
    field?: {
      name: string;
      type: string;
      required: boolean;
      relationTo?: string;
    };
    fieldName?: string;
  }>;
  status: "success" | "error";
  error?: {
    message: string;
    suggestion?: string;
    retryable: boolean;
  };
}

/**
 * Process a user message through the AI agent
 */
export const processMessage = action({
  args: {
    projectUuid: v.string(),
    messageId: v.id("messages"),
    userMessage: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const { projectUuid, messageId, userMessage } = args;

    try {
      // Get current project files
      const files = await ctx.runQuery(api.projectFiles.listByProject, {
        projectUuid,
      });

      // Get current schemas
      const schemas = await ctx.runQuery(api.appSchemas.listByProject, {
        projectUuid,
      });

      // Get conversation history
      const messages = await ctx.runQuery(api.messages.listByProject, {
        projectUuid,
      });

      // Build conversation history (excluding the current pending message)
      const conversationHistory = messages
        .filter((m) => m._id !== messageId && m.status === "success")
        .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
        .slice(-10) // Keep last 10 messages for context
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      // Call the AI agent
      const result = await callAIAgent({
        userMessage,
        conversationHistory,
        currentFiles: files.map((f) => ({ path: f.path, content: f.content })),
        currentSchemas: schemas.map((s) => ({
          tableName: s.tableName,
          fields: s.fields,
        })),
      });

      // Apply the result
      await ctx.runMutation(internal.applyResult.applyAgentResult, {
        projectUuid,
        messageId,
        result,
      });
    } catch (error) {
      // Handle errors
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      await ctx.runMutation(api.messages.updateStatus, {
        id: messageId,
        status: "error",
        error: errorMessage,
      });

      // Create error response message
      await ctx.runMutation(api.messages.create, {
        projectUuid,
        role: "assistant",
        content: `I encountered an error: ${errorMessage}. Please try again.`,
        status: "error",
        error: errorMessage,
      });
    }
  },
});

/**
 * Call the Anthropic AI API
 */
async function callAIAgent(context: {
  userMessage: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  currentFiles: Array<{ path: string; content: string }>;
  currentSchemas: Array<{
    tableName: string;
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      relationTo?: string;
    }>;
  }>;
}): Promise<AgentResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      chatMessage: "API key is not configured.",
      fileOps: [],
      schemaOps: [],
      status: "error",
      error: {
        message: "ANTHROPIC_API_KEY environment variable is not set",
        suggestion: "Please configure the API key in your environment",
        retryable: false,
      },
    };
  }

  // Build the system prompt
  const systemPrompt = buildSystemPrompt(context);

  // Build messages array
  const messages = [
    ...context.conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: context.userMessage },
  ];

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const assistantMessage = data.content?.[0]?.text || "";

    // Parse the response to extract operations
    return parseAgentResponse(assistantMessage);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      chatMessage: `I encountered an error while processing your request: ${errorMessage}`,
      fileOps: [],
      schemaOps: [],
      status: "error",
      error: {
        message: errorMessage,
        suggestion: "Please try again",
        retryable: true,
      },
    };
  }
}

/**
 * Build the system prompt for the AI agent
 */
function buildSystemPrompt(context: {
  currentFiles: Array<{ path: string; content: string }>;
  currentSchemas: Array<{
    tableName: string;
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      relationTo?: string;
    }>;
  }>;
}): string {
  const fileList =
    context.currentFiles.length > 0
      ? context.currentFiles.map((f) => `- \`${f.path}\``).join("\n")
      : "No files yet (this is a new project)";

  const fileContents =
    context.currentFiles.length > 0
      ? context.currentFiles
          .slice(0, 10) // Limit to 10 files to avoid context overflow
          .map((f) => `### ${f.path}\n\`\`\`tsx\n${f.content}\n\`\`\``)
          .join("\n\n")
      : "";

  const schemaList =
    context.currentSchemas.length > 0
      ? context.currentSchemas
          .map(
            (s) =>
              `- **${s.tableName}**: ${s.fields.map((f) => `${f.name}: ${f.type}${f.required ? "" : "?"}`).join(", ")}`
          )
          .join("\n")
      : "No data schemas defined yet";

  return `You are an expert React developer building applications. You help users create and modify React components and pages.

## Your Capabilities
- Create new React components with TypeScript
- Create new pages (Next.js App Router files)
- Modify existing components
- Add features to existing code
- Create data schemas for storing data

## Tech Stack
- React 19 with TypeScript
- Next.js 16 (App Router)
- Tailwind CSS for styling
- No UI component library - use native HTML with Tailwind

## Code Style Guidelines

### Components
- Use functional components with TypeScript
- Use \`"use client"\` directive for interactive components (with useState, useEffect, onClick, etc.)
- Export components as named exports
- Use descriptive variable and function names

### Styling with Tailwind CSS
- Use Tailwind utility classes for all styling
- Common button: \`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors\`
- Common input: \`px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500\`
- Common card: \`p-4 bg-white rounded-lg shadow-md\`

### File Structure
- Components: \`src/components/ComponentName.tsx\`
- Pages: \`src/app/route-name/page.tsx\`

## Current Project State

### Files in Project:
${fileList}

### Data Schemas:
${schemaList}

${fileContents ? `## Current File Contents\n\n${fileContents}` : ""}

## Response Format

You MUST respond with valid JSON in this exact format:

\`\`\`json
{
  "chatMessage": "Your response explaining what you created/modified",
  "fileOps": [
    { "type": "create", "path": "src/components/Example.tsx", "content": "full file content" },
    { "type": "update", "path": "src/app/page.tsx", "content": "full updated content" },
    { "type": "delete", "path": "src/old-file.tsx" }
  ],
  "schemaOps": [
    { "type": "createTable", "tableName": "posts", "fields": [
      { "name": "title", "type": "string", "required": true },
      { "name": "content", "type": "string", "required": true }
    ]}
  ]
}
\`\`\`

## Critical Rules

1. **Complete files only**: Always provide the COMPLETE file content, never partial updates.
2. **Valid TypeScript**: All code must be valid TypeScript with proper types.
3. **Working code**: Code must work immediately without additional setup.
4. **Proper imports**: Include ALL necessary imports at the top.
5. **No placeholders**: Never use "// TODO" or "// add more here" comments.
6. **JSON only**: Respond ONLY with valid JSON wrapped in \`\`\`json blocks. No other text.
7. **File paths**: Must start with \`src/\` or \`public/\`. Never modify config files.
8. **Schema types**: Use \`string\`, \`number\`, \`boolean\`, \`date\`, or \`relation\`.`;
}

/**
 * Parse the agent response to extract operations
 */
function parseAgentResponse(response: string): AgentResult {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : response;

    // Try to parse as JSON
    const parsed = JSON.parse(jsonStr.trim());

    // Validate and return
    return {
      chatMessage: parsed.chatMessage || "Done!",
      fileOps: Array.isArray(parsed.fileOps) ? parsed.fileOps : [],
      schemaOps: Array.isArray(parsed.schemaOps) ? parsed.schemaOps : [],
      status: "success",
    };
  } catch {
    // If parsing fails, treat the response as just a chat message
    return {
      chatMessage: response,
      fileOps: [],
      schemaOps: [],
      status: "success",
    };
  }
}
