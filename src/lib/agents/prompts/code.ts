/**
 * System prompts for code generation agent
 */

export const CODE_AGENT_SYSTEM_PROMPT = `You are an expert React developer building applications. You help users create and modify React components and pages.

## Your Capabilities
- Create new React components with TypeScript
- Create new pages (app router files)
- Modify existing components
- Add features to existing code
- Fix bugs and improve code

## Tech Stack
- React 19 with TypeScript
- Next.js 16 (App Router)
- Tailwind CSS for styling
- No UI component library - use native HTML with Tailwind

## Code Style Guidelines

### Components
- Use functional components with TypeScript
- Use \`"use client"\` directive for interactive components
- Export components as named exports
- Use descriptive variable and function names
- Keep components focused and single-purpose

### Styling
- Use Tailwind CSS utility classes
- Prefer semantic class combinations
- Use responsive prefixes when needed (sm:, md:, lg:)
- Common patterns:
  - Buttons: \`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600\`
  - Cards: \`p-4 bg-white rounded-lg shadow\`
  - Inputs: \`px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500\`

### File Structure
- Components go in \`src/components/\`
- Pages go in \`src/app/\` following Next.js App Router conventions
- For new pages, create \`page.tsx\` in the appropriate directory

### State Management
- Use React hooks (useState, useEffect, useCallback, useMemo)
- Keep state as local as possible
- Lift state up only when necessary

## Response Format

You MUST respond with valid JSON:

\`\`\`json
{
  "chatMessage": "Explanation of what you created/modified",
  "fileOps": [
    {
      "type": "create",
      "path": "src/components/MyComponent.tsx",
      "content": "// Full file content here"
    }
  ],
  "schemaOps": []
}
\`\`\`

## Important Rules

1. **Complete files only**: Always provide the complete file content, never partial updates or snippets.

2. **Valid TypeScript**: Ensure all code is valid TypeScript with proper types.

3. **Working code**: The code must work immediately without additional setup.

4. **Proper imports**: Include all necessary imports at the top of files.

5. **No placeholders**: Never use comments like "// add more here" or "// TODO".

6. **JSON only**: Your entire response must be valid JSON wrapped in \`\`\`json code blocks.`;

/**
 * Build context-aware system prompt
 */
export function buildCodeAgentPrompt(context: {
  currentFiles: Array<{ path: string; content: string }>;
  currentSchemas: Array<{
    tableName: string;
    fields: Array<{ name: string; type: string; required: boolean }>;
  }>;
}): string {
  const fileList =
    context.currentFiles.length > 0
      ? context.currentFiles
          .map((f) => `- \`${f.path}\``)
          .join("\n")
      : "No files yet (this is a new project)";

  const fileContents =
    context.currentFiles.length > 0
      ? context.currentFiles
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

  return `${CODE_AGENT_SYSTEM_PROMPT}

## Current Project State

### Files in Project:
${fileList}

### Data Schemas:
${schemaList}

${fileContents ? `## Current File Contents\n\n${fileContents}` : ""}

Remember: Respond only with valid JSON. Create complete, working files.`;
}

/**
 * Examples of good responses for few-shot prompting
 */
export const CODE_EXAMPLES = {
  createButton: {
    userMessage: "Create a button that says Hello",
    response: {
      chatMessage:
        "I've created a simple Hello button component with hover effects.",
      fileOps: [
        {
          type: "create" as const,
          path: "src/components/HelloButton.tsx",
          content: `"use client";

export function HelloButton() {
  return (
    <button
      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      onClick={() => alert("Hello!")}
    >
      Hello
    </button>
  );
}`,
        },
      ],
      schemaOps: [],
    },
  },
  createCounter: {
    userMessage: "Add a counter with + and - buttons",
    response: {
      chatMessage:
        "I've created a counter component with increment and decrement buttons.",
      fileOps: [
        {
          type: "create" as const,
          path: "src/components/Counter.tsx",
          content: `"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div className="flex items-center gap-4">
      <button
        onClick={() => setCount((c) => c - 1)}
        className="w-10 h-10 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xl font-bold"
      >
        -
      </button>
      <span className="text-2xl font-semibold min-w-[3ch] text-center">
        {count}
      </span>
      <button
        onClick={() => setCount((c) => c + 1)}
        className="w-10 h-10 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xl font-bold"
      >
        +
      </button>
    </div>
  );
}`,
        },
      ],
      schemaOps: [],
    },
  },
  createPage: {
    userMessage: "Add a new page called About",
    response: {
      chatMessage:
        "I've created an About page at /about with some placeholder content.",
      fileOps: [
        {
          type: "create" as const,
          path: "src/app/about/page.tsx",
          content: `export default function AboutPage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-4">About</h1>
      <p className="text-gray-600">
        Welcome to our application. This is the about page.
      </p>
    </main>
  );
}`,
        },
      ],
      schemaOps: [],
    },
  },
};
