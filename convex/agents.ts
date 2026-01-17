"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// ============================================================================
// APP TYPE KNOWLEDGE BASE
// ============================================================================

const APP_TYPE_KNOWLEDGE = `
## App Type Knowledge Base

### Habit Tracker (NOT a todo list!)
Purpose: Track recurring behaviors over time
REQUIRED features:
- Habit list (behaviors that repeat daily/weekly)
- Daily logging (check off for TODAY, not complete forever)
- Streak tracking (consecutive days completed)
- Progress view (history of completions)

Key difference from todo: Habits are NEVER deleted when "done" - they reset each day.

Data model:
- habits: { id, name, frequency, createdAt }
- habit_logs: { habitId, date, completed }

UI patterns:
- Show today's date prominently
- Each habit has a checkbox for TODAY only
- Show streak count next to each habit
- Maybe a calendar view for history

### Todo List
Purpose: Track one-time tasks
REQUIRED features:
- Add tasks with text input
- Mark complete (checkbox or button)
- Delete tasks
- Tasks disappear or get crossed out when done

Data model:
- todos: { id, text, completed, createdAt }

UI patterns:
- Text input with add button
- List of tasks with checkboxes
- Delete button per task

### Counter App
Purpose: Track a numeric value
REQUIRED features:
- Display current count (large, centered number)
- Increment button (+)
- Decrement button (-)
- Optional: Reset button

Data model:
- Just use React state (useState)

UI patterns:
- Large centered number
- +/- buttons on either side

### Contact Form / Forms
Purpose: Collect user input
REQUIRED features:
- Input fields (name, email, message, etc.)
- Submit button
- Validation feedback (show errors)
- Success message after submit

Data model:
- Store form data in state
- Optional: submissions table for persistence

UI patterns:
- Vertical form layout
- Labels above inputs
- Error messages below invalid fields
- Submit button at bottom

### Expense Tracker
Purpose: Track spending and budgets
REQUIRED features:
- Add expense (amount, category, description, date)
- View expense list
- Show total/summary
- Optional: categories, filters

Data model:
- expenses: { id, amount, category, description, date }

### Notes App
Purpose: Create and manage text notes
REQUIRED features:
- Create new notes
- Edit existing notes
- Delete notes
- List all notes

Data model:
- notes: { id, title, content, createdAt, updatedAt }
`;

// Intent classification result type
interface IntentClassification {
  appType: "habit-tracker" | "todo-list" | "counter" | "form" | "expense-tracker" | "notes" | "custom";
  requestType: "create-new" | "modify-existing" | "fix-bug" | "add-feature" | "clarify";
  requiredFeatures: string[];
  dataEntities: Array<{ name: string; fields: string[] }>;
  whatIUnderstood: string;
}

// Frustration analysis result type
interface FrustrationAnalysis {
  level: "low" | "medium" | "high";
  signals: {
    repetition: boolean;
    contradiction: boolean;
    escalation: boolean;
    explicit: boolean;
  };
  suggestedAction: "proceed" | "acknowledge-and-dig-deeper" | "ask-clarifying-question";
  acknowledgmentMessage?: string;
}

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

// ============================================================================
// INTENT CLASSIFICATION
// ============================================================================

/**
 * Classify user intent before generating code
 */
async function classifyIntent(params: {
  userMessage: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  currentSchemas: Array<{ tableName: string; fields: Array<{ name: string; type: string; required: boolean }> }>;
  apiKey: string;
}): Promise<IntentClassification> {
  const { userMessage, conversationHistory, currentSchemas, apiKey } = params;

  const hasExistingSchemas = currentSchemas.length > 0;
  const schemaContext = hasExistingSchemas
    ? `Existing data tables: ${currentSchemas.map(s => s.tableName).join(", ")}`
    : "No existing data tables (new project)";

  const recentHistory = conversationHistory.slice(-4).map(m =>
    `${m.role}: ${m.content.substring(0, 200)}`
  ).join("\n");

  const intentPrompt = `Analyze this user request and classify it.

${APP_TYPE_KNOWLEDGE}

## Current Project State
${schemaContext}

## Recent Conversation
${recentHistory || "No previous messages"}

## Current User Request
"${userMessage}"

## Your Task
Classify this request. Pay special attention to:
1. Is this a HABIT TRACKER or a TODO LIST? They are different!
2. What specific features does the user want?
3. Is this a new project or modifying existing code?

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "appType": "habit-tracker" | "todo-list" | "counter" | "form" | "expense-tracker" | "notes" | "custom",
  "requestType": "create-new" | "modify-existing" | "fix-bug" | "add-feature" | "clarify",
  "requiredFeatures": ["list of specific features the user wants"],
  "dataEntities": [{ "name": "tableName", "fields": ["field1", "field2"] }],
  "whatIUnderstood": "One sentence summary of what you'll build"
}`;

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
        max_tokens: 1024,
        messages: [{ role: "user", content: intentPrompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Intent classification failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "{}";

    // Parse the JSON response
    const parsed = JSON.parse(content.trim());

    return {
      appType: parsed.appType || "custom",
      requestType: parsed.requestType || "create-new",
      requiredFeatures: parsed.requiredFeatures || [],
      dataEntities: parsed.dataEntities || [],
      whatIUnderstood: parsed.whatIUnderstood || "Building what you requested",
    };
  } catch (error) {
    // Default classification if parsing fails
    console.error("Intent classification error:", error);
    return {
      appType: "custom",
      requestType: "create-new",
      requiredFeatures: [],
      dataEntities: [],
      whatIUnderstood: userMessage.substring(0, 100),
    };
  }
}

// ============================================================================
// FRUSTRATION DETECTION
// ============================================================================

/**
 * Detect if user is frustrated based on conversation patterns
 */
function detectFrustration(
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>
): FrustrationAnalysis {
  const userMessages = conversationHistory
    .filter(m => m.role === "user")
    .map(m => m.content.toLowerCase());

  const recentUserMessages = userMessages.slice(-4);

  const signals = {
    repetition: false,
    contradiction: false,
    escalation: false,
    explicit: false,
  };

  // Check for explicit frustration words
  const frustrationWords = [
    "frustrated", "annoying", "annoyed", "doesn't work", "still doesn't",
    "wrong", "not what i", "not what I", "again", "still", "broken",
    "same problem", "same issue", "keeps", "why won't", "why doesn't"
  ];

  for (const msg of recentUserMessages) {
    if (frustrationWords.some(word => msg.includes(word))) {
      signals.explicit = true;
      break;
    }
  }

  // Check for contradiction patterns
  const contradictionPhrases = [
    "that's not", "no,", "not what i asked", "not what I asked",
    "i said", "I said", "i wanted", "I wanted", "i meant", "I meant"
  ];

  for (const msg of recentUserMessages) {
    if (contradictionPhrases.some(phrase => msg.includes(phrase))) {
      signals.contradiction = true;
      break;
    }
  }

  // Check for repetition - similar requests appearing multiple times
  if (recentUserMessages.length >= 2) {
    const lastMessage = recentUserMessages[recentUserMessages.length - 1];
    for (let i = 0; i < recentUserMessages.length - 1; i++) {
      const prevMessage = recentUserMessages[i];
      // Check for significant word overlap (repetition)
      const lastWords = new Set(lastMessage.split(/\s+/).filter(w => w.length > 3));
      const prevWords = prevMessage.split(/\s+/).filter(w => w.length > 3);
      const overlap = prevWords.filter(w => lastWords.has(w)).length;
      if (overlap >= 3) {
        signals.repetition = true;
        break;
      }
    }
  }

  // Check for escalation patterns
  const escalationPhrases = [
    "still", "again", "another", "keep", "keeps", "yet again",
    "one more time", "try again", "please fix"
  ];

  for (const msg of recentUserMessages) {
    if (escalationPhrases.some(phrase => msg.includes(phrase))) {
      signals.escalation = true;
      break;
    }
  }

  // Determine frustration level and suggested action
  const signalCount = Object.values(signals).filter(Boolean).length;

  let level: "low" | "medium" | "high" = "low";
  let suggestedAction: "proceed" | "acknowledge-and-dig-deeper" | "ask-clarifying-question" = "proceed";
  let acknowledgmentMessage: string | undefined;

  if (signals.explicit || signalCount >= 3) {
    level = "high";
    suggestedAction = "acknowledge-and-dig-deeper";
    acknowledgmentMessage = "I can see this isn't working as expected. Let me carefully review what you need and make sure I get it right this time.";
  } else if (signalCount >= 2 || signals.contradiction) {
    level = "medium";
    suggestedAction = "acknowledge-and-dig-deeper";
    acknowledgmentMessage = "I want to make sure I understand exactly what you're looking for.";
  } else if (signals.repetition || signals.escalation) {
    level = "medium";
    suggestedAction = "ask-clarifying-question";
  }

  return {
    level,
    signals,
    suggestedAction,
    acknowledgmentMessage,
  };
}

/**
 * Process a user message through the AI agent with multi-phase pipeline
 *
 * Pipeline:
 * 1. Intent Classification - Understand what the user wants
 * 2. Frustration Detection - Check if user is repeating/unsatisfied
 * 3. Code Generation - Generate code with requirements context
 * 4. Self-Verification - Check code implements requirements
 */
export const processMessage = action({
  args: {
    projectUuid: v.string(),
    messageId: v.id("messages"),
    userMessage: v.string(),
  },
  handler: async (ctx, args): Promise<void> => {
    const { projectUuid, messageId, userMessage } = args;

    // Create the streaming assistant message first
    const assistantMessageId = await ctx.runMutation(
      api.messages.createStreaming,
      { projectUuid }
    );

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      await ctx.runMutation(internal.internalMutations.updateStreamingContent, {
        messageId: assistantMessageId,
        content: "API key is not configured. Please set ANTHROPIC_API_KEY.",
        status: "error",
      });
      return;
    }

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

      // Build conversation history (excluding pending messages)
      const conversationHistory = messages
        .filter(
          (m) =>
            m._id !== messageId &&
            m._id !== assistantMessageId &&
            m.status === "success"
        )
        .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
        .slice(-10)
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        }));

      // ========================================
      // PHASE 1: Intent Classification
      // ========================================
      await ctx.runMutation(internal.internalMutations.updateStreamingContent, {
        messageId: assistantMessageId,
        content: "Understanding your request...",
      });

      const intent = await classifyIntent({
        userMessage,
        conversationHistory,
        currentSchemas: schemas.map((s) => ({
          tableName: s.tableName,
          fields: s.fields,
        })),
        apiKey,
      });

      // ========================================
      // PHASE 2: Frustration Detection
      // ========================================
      const frustration = detectFrustration(conversationHistory);

      // ========================================
      // PHASE 3: Code Generation with Context
      // ========================================
      const result = await callAIAgentWithStreaming({
        ctx,
        assistantMessageId,
        userMessage,
        conversationHistory,
        currentFiles: files.map((f) => ({ path: f.path, content: f.content })),
        currentSchemas: schemas.map((s) => ({
          tableName: s.tableName,
          fields: s.fields,
        })),
        intent,
        frustration,
      });

      // Update user message status to success
      await ctx.runMutation(api.messages.updateStatus, {
        id: messageId,
        status: "success",
      });

      // Apply the result (file and schema ops)
      await ctx.runMutation(internal.applyResult.applyAgentResult, {
        projectUuid,
        messageId,
        result,
      });

      // ========================================
      // PHASE 4: Self-Verification
      // ========================================
      const verification = verifyImplementation(intent, result);

      // ========================================
      // PHASE 5: Build final message with "What I Understood"
      // ========================================
      const finalMessage = buildFinalMessage(intent, frustration, result, verification);

      // Mark assistant message as complete
      await ctx.runMutation(internal.internalMutations.updateStreamingContent, {
        messageId: assistantMessageId,
        content: finalMessage,
        status: "success",
      });
    } catch (error) {
      // Convert technical errors to user-friendly messages
      const friendlyError = getFriendlyErrorMessage(error);

      // Update user message status (keep technical error for debugging)
      await ctx.runMutation(api.messages.updateStatus, {
        id: messageId,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });

      // Update assistant message with friendly error
      await ctx.runMutation(internal.internalMutations.updateStreamingContent, {
        messageId: assistantMessageId,
        content: friendlyError,
        status: "error",
      });
    }
  },
});

/**
 * Build a user-friendly message that hides technical details
 * and presents changes in plain English
 */
function buildFinalMessage(
  intent: IntentClassification,
  frustration: FrustrationAnalysis,
  result: AgentResult,
  verification?: VerificationResult
): string {
  const parts: string[] = [];

  // Add frustration acknowledgment if needed
  if (frustration.acknowledgmentMessage && frustration.level !== "low") {
    parts.push(frustration.acknowledgmentMessage);
    parts.push("");
  }

  // Add "What I understood" section in plain language
  parts.push("**What I understood:**");
  parts.push(intent.whatIUnderstood);
  parts.push("");

  // Add what was built in user-friendly terms
  const changes = buildUserFriendlyChanges(result, intent);
  if (changes.length > 0) {
    parts.push("**What I built:**");
    for (const change of changes) {
      parts.push(`- ${change}`);
    }
    parts.push("");
  }

  // Add features verification status if available
  if (verification && verification.missingFeatures.length > 0) {
    parts.push("**Note:** Let me know if you'd like me to adjust anything!");
    parts.push("");
  }

  // Add a friendly closing message (extract just the user-friendly part)
  const friendlyMessage = extractFriendlyMessage(result.chatMessage);
  if (friendlyMessage) {
    parts.push(friendlyMessage);
  }

  return parts.join("\n");
}

/**
 * Convert technical file/schema operations into user-friendly descriptions
 */
function buildUserFriendlyChanges(result: AgentResult, intent: IntentClassification): string[] {
  const changes: string[] = [];

  // Convert file operations to friendly descriptions
  for (const op of result.fileOps) {
    const friendlyPath = getFriendlyFileName(op.path);

    if (op.type === "create") {
      if (op.path.includes("/app/page.tsx")) {
        changes.push(`Created your main app screen`);
      } else if (op.path.includes("/components/")) {
        changes.push(`Added a new ${friendlyPath}`);
      } else {
        changes.push(`Created ${friendlyPath}`);
      }
    } else if (op.type === "update") {
      if (op.path.includes("/app/page.tsx")) {
        changes.push(`Updated your main app screen`);
      } else {
        changes.push(`Updated ${friendlyPath}`);
      }
    } else if (op.type === "delete") {
      changes.push(`Removed ${friendlyPath}`);
    }
  }

  // Convert schema operations to friendly descriptions
  for (const op of result.schemaOps) {
    const friendlyTable = getFriendlyTableName(op.tableName);

    if (op.type === "createTable") {
      changes.push(`Set up storage for your ${friendlyTable}`);
    } else if (op.type === "addField") {
      changes.push(`Added a new field to ${friendlyTable}`);
    } else if (op.type === "deleteTable") {
      changes.push(`Removed storage for ${friendlyTable}`);
    }
  }

  // If no specific changes, add a generic message based on intent
  if (changes.length === 0 && intent.requiredFeatures.length > 0) {
    for (const feature of intent.requiredFeatures.slice(0, 3)) {
      changes.push(feature);
    }
  }

  return changes;
}

/**
 * Convert file paths to user-friendly names
 */
function getFriendlyFileName(path: string): string {
  const filename = path.split("/").pop() || path;

  // Remove file extension
  const name = filename.replace(/\.(tsx?|jsx?)$/, "");

  // Convert to readable format
  const readable = name
    .replace(/([A-Z])/g, " $1") // Add space before capitals
    .replace(/[-_]/g, " ")      // Replace dashes/underscores with spaces
    .trim()
    .toLowerCase();

  // Special cases
  if (name === "page") return "screen";
  if (readable === "page") return "page";

  return readable;
}

/**
 * Convert table names to user-friendly descriptions
 */
function getFriendlyTableName(tableName: string): string {
  const friendly = tableName
    .replace(/([A-Z])/g, " $1")
    .replace(/[-_]/g, " ")
    .trim()
    .toLowerCase();

  // Make it more natural
  if (friendly.endsWith("s")) {
    return friendly;
  }
  return `${friendly} items`;
}

/**
 * Extract the user-friendly part of a chat message,
 * removing any technical details or code references
 */
function extractFriendlyMessage(message: string): string {
  // Remove any JSON blocks
  let clean = message.replace(/```json[\s\S]*?```/g, "");

  // Remove any code blocks
  clean = clean.replace(/```[\s\S]*?```/g, "");

  // Remove file paths
  clean = clean.replace(/`[^`]+\.(tsx?|jsx?|ts|js)`/g, "");
  clean = clean.replace(/\/\w+\/[\w./]+/g, "");

  // Remove technical terms
  clean = clean.replace(/\b(component|useState|useEffect|props|state|import|export|function|const|let|var)\b/gi, "");

  // Clean up extra whitespace
  clean = clean.replace(/\s+/g, " ").trim();

  // If the message is too short or empty after cleaning, return empty
  if (clean.length < 10) {
    return "";
  }

  return clean;
}

/**
 * Call the Anthropic AI API with streaming
 */
async function callAIAgentWithStreaming(params: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ctx: any; // ActionCtx with runMutation
  assistantMessageId: Id<"messages">;
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
  intent: IntentClassification;
  frustration: FrustrationAnalysis;
}): Promise<AgentResult> {
  const {
    ctx,
    assistantMessageId,
    userMessage,
    conversationHistory,
    currentFiles,
    currentSchemas,
    intent,
    frustration,
  } = params;

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

  // Build the enhanced system prompt with requirements context
  const systemPrompt = buildSystemPromptWithRequirements({
    currentFiles,
    currentSchemas,
    intent,
    frustration,
  });

  // Build messages array
  const messages = [
    ...conversationHistory.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
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
        stream: true,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
    }

    // Process the streaming response
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let fullContent = "";
    let lastUpdateLength = 0;
    const UPDATE_THRESHOLD = 20; // Update every ~20 characters for smooth streaming

    // Extract just the chatMessage part for display (before the JSON code block)
    const extractDisplayContent = (content: string): string => {
      // Check for JSON code block
      const jsonStart = content.indexOf("```json");
      if (jsonStart !== -1) {
        // Once JSON starts, show only pre-JSON content or a progress indicator
        const preJson = content.substring(0, jsonStart).trim();
        return preJson || "Building your app...";
      }

      // Check for raw JSON (starts with { or has JSON-like patterns)
      const trimmed = content.trim();
      if (trimmed.startsWith("{") || trimmed.includes('"fileOps"') || trimmed.includes('"chatMessage"')) {
        // Looks like raw JSON, show a progress message instead
        return "Building your app...";
      }

      // Check for code blocks without json tag
      const codeBlockStart = content.indexOf("```");
      if (codeBlockStart !== -1) {
        const preCode = content.substring(0, codeBlockStart).trim();
        return preCode || "Building your app...";
      }

      // Safe to show the content
      return content;
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta") {
              const text = parsed.delta?.text || "";
              fullContent += text;

              // Update the message periodically for smooth streaming
              if (fullContent.length - lastUpdateLength >= UPDATE_THRESHOLD) {
                const displayContent = extractDisplayContent(fullContent);
                await ctx.runMutation(internal.internalMutations.updateStreamingContent, {
                  messageId: assistantMessageId,
                  content: displayContent,
                });
                lastUpdateLength = fullContent.length;
              }
            }
          } catch {
            // Ignore parse errors for non-JSON lines
          }
        }
      }
    }

    // Final update with the display content
    const finalDisplayContent = extractDisplayContent(fullContent);
    await ctx.runMutation(internal.internalMutations.updateStreamingContent, {
      messageId: assistantMessageId,
      content: finalDisplayContent,
    });

    // Parse the full response to extract operations
    return parseAgentResponse(fullContent);
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
 * Build the enhanced system prompt with requirements context
 */
function buildSystemPromptWithRequirements(context: {
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
  intent: IntentClassification;
  frustration: FrustrationAnalysis;
}): string {
  const { currentFiles, currentSchemas, intent, frustration } = context;

  const fileList =
    currentFiles.length > 0
      ? currentFiles.map((f) => `- \`${f.path}\``).join("\n")
      : "No files yet (this is a new project)";

  const fileContents =
    currentFiles.length > 0
      ? currentFiles
          .slice(0, 10)
          .map((f) => `### ${f.path}\n\`\`\`tsx\n${f.content}\n\`\`\``)
          .join("\n\n")
      : "";

  const schemaList =
    currentSchemas.length > 0
      ? currentSchemas
          .map(
            (s) =>
              `- **${s.tableName}**: ${s.fields.map((f) => `${f.name}: ${f.type}${f.required ? "" : "?"}`).join(", ")}`
          )
          .join("\n")
      : "No data schemas defined yet";

  // Build requirements section based on intent
  const requirementsSection = buildRequirementsSection(intent);

  // Build frustration context if needed
  const frustrationContext = frustration.level !== "low"
    ? `\n## IMPORTANT CONTEXT\nThe user may be frustrated with previous responses. ${frustration.acknowledgmentMessage || ""} Make sure to carefully implement ALL requested features.\n`
    : "";

  // Build verification checklist
  const verificationChecklist = intent.requiredFeatures.length > 0
    ? `## VERIFICATION CHECKLIST
Before responding, verify your code includes:
${intent.requiredFeatures.map(f => `- [ ] Does my code implement "${f}"? If not, ADD IT.`).join("\n")}
`
    : "";

  return `You are an expert React developer building a ${intent.appType.replace("-", " ")}.
${frustrationContext}
${APP_TYPE_KNOWLEDGE}

## REQUIREMENTS (MUST IMPLEMENT ALL)

${requirementsSection}

${verificationChecklist}

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
- Components: \`/components/ComponentName.tsx\`
- Pages: \`/app/route-name/page.tsx\` (use \`/app/page.tsx\` for the home page)

## Current Project State

### Files in Project:
${fileList}

### Data Schemas:
${schemaList}

${fileContents ? `## Current File Contents\n\n${fileContents}` : ""}

## Response Format

IMPORTANT: First write a brief explanation of what you're going to create/modify (1-2 sentences). Then provide the JSON.

You MUST respond with valid JSON in this exact format:

\`\`\`json
{
  "chatMessage": "Your response explaining what you created/modified",
  "fileOps": [
    { "type": "create", "path": "/components/Example.tsx", "content": "full file content" },
    { "type": "update", "path": "/app/page.tsx", "content": "full updated content" },
    { "type": "delete", "path": "/components/old-file.tsx" }
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
6. **JSON only**: After your brief explanation, respond ONLY with valid JSON wrapped in \`\`\`json blocks.
7. **File paths**: Use paths like \`/app/page.tsx\`, \`/components/MyComponent.tsx\`, \`/lib/utils.ts\`. Never modify config files (package.json, tsconfig.json, etc.).
8. **Schema types**: Use \`string\`, \`number\`, \`boolean\`, \`date\`, or \`relation\`.
9. **Update existing files**: When modifying the main page, update \`/app/page.tsx\` (not create a new file). Check the existing files list above.
10. **Implement ALL features**: Make sure EVERY feature in the requirements is actually implemented in the code, not just mentioned.`;
}

/**
 * Build the requirements section based on classified intent
 */
function buildRequirementsSection(intent: IntentClassification): string {
  const parts: string[] = [];

  parts.push(`**App Type:** ${intent.appType.replace("-", " ")}`);
  parts.push(`**What User Wants:** ${intent.whatIUnderstood}`);
  parts.push("");

  if (intent.requiredFeatures.length > 0) {
    parts.push("**Required Features (MUST IMPLEMENT ALL):**");
    for (const feature of intent.requiredFeatures) {
      parts.push(`- [ ] ${feature}`);
    }
    parts.push("");
  }

  if (intent.dataEntities.length > 0) {
    parts.push("**Required Data Structures:**");
    for (const entity of intent.dataEntities) {
      parts.push(`- ${entity.name}: ${entity.fields.join(", ")}`);
    }
    parts.push("");
  }

  return parts.join("\n");
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
    // If parsing fails, clean up the response before showing to user
    // This prevents raw JSON/code from being displayed
    const cleanedResponse = cleanResponseForDisplay(response);
    return {
      chatMessage: cleanedResponse,
      fileOps: [],
      schemaOps: [],
      status: "success",
    };
  }
}

/**
 * Clean up a raw AI response to be safe for display to non-technical users
 * This is the fallback when JSON parsing fails
 */
function cleanResponseForDisplay(response: string): string {
  let clean = response;

  // Remove JSON code blocks
  clean = clean.replace(/```json[\s\S]*?```/g, "");

  // Remove any code blocks
  clean = clean.replace(/```[\s\S]*?```/g, "");

  // Remove raw JSON objects (lines starting with { or containing "type":)
  clean = clean.replace(/^\s*\{[\s\S]*?\}\s*$/gm, "");

  // Remove lines that look like JSON properties
  clean = clean.replace(/^\s*"[^"]+"\s*:\s*[\[\{"].*$/gm, "");
  clean = clean.replace(/^\s*[\[\]{}],?\s*$/gm, "");

  // Remove file paths and technical references
  clean = clean.replace(/`[^`]+\.(tsx?|jsx?|ts|js|json)`/g, "");
  clean = clean.replace(/\/\w+\/[\w./]+\.(tsx?|jsx?|ts|js)/g, "");

  // Remove common technical terms
  clean = clean.replace(/\b(fileOps|schemaOps|chatMessage|content|type|path)\b:\s*/gi, "");

  // Clean up extra whitespace and newlines
  clean = clean.replace(/\n{3,}/g, "\n\n");
  clean = clean.trim();

  // If the result is too short or empty, provide a default message
  if (clean.length < 20) {
    return "I've made some changes to your app. Check the preview to see the updates!";
  }

  return clean;
}

// ============================================================================
// SELF-VERIFICATION
// ============================================================================

interface VerificationResult {
  allRequirementsMet: boolean;
  implementedFeatures: string[];
  missingFeatures: string[];
  issues: string[];
}

/**
 * Verify that generated code implements all required features
 * This is a lightweight check that runs after code generation
 */
function verifyImplementation(
  intent: IntentClassification,
  result: AgentResult
): VerificationResult {
  const implementedFeatures: string[] = [];
  const missingFeatures: string[] = [];
  const issues: string[] = [];

  // Get all generated code content
  const allCode = result.fileOps
    .filter(op => op.type !== "delete" && op.content)
    .map(op => op.content)
    .join("\n")
    .toLowerCase();

  // Get all schema table names
  const schemaTables = result.schemaOps
    .filter(op => op.type === "createTable")
    .map(op => op.tableName.toLowerCase());

  // Check each required feature
  for (const feature of intent.requiredFeatures) {
    const featureLower = feature.toLowerCase();
    let found = false;

    // Check for common feature indicators in code
    if (featureLower.includes("add") || featureLower.includes("create")) {
      // Look for form inputs, add buttons, or state setters
      if (allCode.includes("oninput") || allCode.includes("onchange") ||
          allCode.includes("setstate") || allCode.includes("usestate") ||
          allCode.includes("<input") || allCode.includes("<form") ||
          allCode.includes("button") && allCode.includes("add")) {
        found = true;
      }
    }

    if (featureLower.includes("delete") || featureLower.includes("remove")) {
      if (allCode.includes("delete") || allCode.includes("remove") ||
          allCode.includes("filter(")) {
        found = true;
      }
    }

    if (featureLower.includes("list") || featureLower.includes("view") || featureLower.includes("display")) {
      if (allCode.includes(".map(") || allCode.includes("foreach") ||
          allCode.includes("<ul") || allCode.includes("<li")) {
        found = true;
      }
    }

    if (featureLower.includes("streak") || featureLower.includes("count")) {
      if (allCode.includes("streak") || allCode.includes("count") ||
          allCode.includes("consecutive")) {
        found = true;
      }
    }

    if (featureLower.includes("checkbox") || featureLower.includes("check") || featureLower.includes("toggle")) {
      if (allCode.includes("checkbox") || allCode.includes("checked") ||
          allCode.includes("toggle")) {
        found = true;
      }
    }

    if (featureLower.includes("date") || featureLower.includes("today") || featureLower.includes("daily")) {
      if (allCode.includes("date") || allCode.includes("today") ||
          allCode.includes("new date")) {
        found = true;
      }
    }

    if (featureLower.includes("increment") || featureLower.includes("+")) {
      if (allCode.includes("+ 1") || allCode.includes("+1") ||
          allCode.includes("increment")) {
        found = true;
      }
    }

    if (featureLower.includes("decrement") || featureLower.includes("-")) {
      if (allCode.includes("- 1") || allCode.includes("-1") ||
          allCode.includes("decrement")) {
        found = true;
      }
    }

    // General keyword matching as fallback
    const keywords = featureLower.split(/\s+/).filter(w => w.length > 3);
    if (!found && keywords.some(keyword => allCode.includes(keyword))) {
      found = true;
    }

    if (found) {
      implementedFeatures.push(feature);
    } else {
      missingFeatures.push(feature);
    }
  }

  // Check data entities
  for (const entity of intent.dataEntities) {
    const entityName = entity.name.toLowerCase();
    if (!schemaTables.includes(entityName) && !allCode.includes(entityName)) {
      issues.push(`Data entity "${entity.name}" may not be implemented`);
    }
  }

  // Check for empty file operations on create-new requests
  if (intent.requestType === "create-new" && result.fileOps.length === 0) {
    issues.push("No files were created for a new project request");
  }

  return {
    allRequirementsMet: missingFeatures.length === 0 && issues.length === 0,
    implementedFeatures,
    missingFeatures,
    issues,
  };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Convert technical error messages to user-friendly language
 */
function getFriendlyErrorMessage(error: unknown): string {
  const technicalMessage = error instanceof Error ? error.message : String(error);

  // Check for common error patterns and provide friendly alternatives
  if (technicalMessage.includes("ANTHROPIC_API_KEY")) {
    return "I'm having trouble connecting to my brain right now. Please try again in a moment.";
  }

  if (technicalMessage.includes("rate limit") || technicalMessage.includes("429")) {
    return "I'm a bit overwhelmed right now. Please wait a moment and try again.";
  }

  if (technicalMessage.includes("timeout") || technicalMessage.includes("ETIMEDOUT")) {
    return "That took longer than expected. Let me try again - please send your message once more.";
  }

  if (technicalMessage.includes("network") || technicalMessage.includes("fetch")) {
    return "I'm having trouble connecting. Please check your internet and try again.";
  }

  if (technicalMessage.includes("JSON") || technicalMessage.includes("parse")) {
    return "Something went wrong on my end. Let me try that again - please send your message once more.";
  }

  if (technicalMessage.includes("500") || technicalMessage.includes("502") || technicalMessage.includes("503")) {
    return "The service is temporarily unavailable. Please try again in a moment.";
  }

  // Default friendly message
  return "Something unexpected happened. Please try sending your message again. If this keeps happening, try refreshing the page.";
}
