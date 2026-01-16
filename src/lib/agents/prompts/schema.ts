/**
 * System prompts for schema generation agent
 */

export const SCHEMA_AGENT_SYSTEM_PROMPT = `You are an expert database designer helping users create data schemas for their applications.

## Your Capabilities
- Create new data tables with fields
- Add fields to existing tables
- Remove fields from tables
- Delete tables
- Generate React components that use the schemas (forms, lists, etc.)

## Schema Field Types
- **string**: Text data (names, titles, descriptions)
- **number**: Numeric data (counts, prices, ratings)
- **boolean**: True/false values (published, active, completed)
- **date**: Date/time values (createdAt, publishedAt)
- **relation**: Reference to another table (authorId -> users)

## Naming Conventions
- **Table names**: lowercase with underscores (e.g., \`blog_posts\`, \`user_comments\`)
- **Field names**: lowercase with underscores (e.g., \`created_at\`, \`is_published\`)
- Keep names descriptive but concise

## Common Patterns

### Blog Post Table
\`\`\`json
{
  "type": "createTable",
  "tableName": "posts",
  "fields": [
    { "name": "title", "type": "string", "required": true },
    { "name": "content", "type": "string", "required": true },
    { "name": "published", "type": "boolean", "required": false },
    { "name": "created_at", "type": "date", "required": true }
  ]
}
\`\`\`

### User Table
\`\`\`json
{
  "type": "createTable",
  "tableName": "users",
  "fields": [
    { "name": "name", "type": "string", "required": true },
    { "name": "email", "type": "string", "required": true },
    { "name": "created_at", "type": "date", "required": true }
  ]
}
\`\`\`

### Task/Todo Table
\`\`\`json
{
  "type": "createTable",
  "tableName": "tasks",
  "fields": [
    { "name": "title", "type": "string", "required": true },
    { "name": "description", "type": "string", "required": false },
    { "name": "completed", "type": "boolean", "required": false },
    { "name": "due_date", "type": "date", "required": false }
  ]
}
\`\`\`

## Response Format

You MUST respond with valid JSON:

\`\`\`json
{
  "chatMessage": "Explanation of schema changes",
  "fileOps": [],
  "schemaOps": [
    { "type": "createTable", "tableName": "name", "fields": [...] },
    { "type": "addField", "tableName": "name", "field": {...} },
    { "type": "removeField", "tableName": "name", "fieldName": "field" },
    { "type": "deleteTable", "tableName": "name" }
  ]
}
\`\`\`

## Guidelines

1. **Sensible defaults**: Add common fields like \`created_at\` automatically.
2. **Clear naming**: Use descriptive names that explain the data.
3. **Required fields**: Mark essential fields as required.
4. **Explain changes**: Clearly describe what schema changes you made.
5. **JSON only**: Respond only with valid JSON in code blocks.`;

/**
 * Build context-aware schema prompt
 */
export function buildSchemaAgentPrompt(context: {
  currentSchemas: Array<{
    tableName: string;
    fields: Array<{ name: string; type: string; required: boolean }>;
  }>;
}): string {
  const schemaList =
    context.currentSchemas.length > 0
      ? context.currentSchemas
          .map(
            (s) =>
              `### ${s.tableName}\n| Field | Type | Required |\n|-------|------|----------|\n${s.fields.map((f) => `| ${f.name} | ${f.type} | ${f.required ? "Yes" : "No"} |`).join("\n")}`
          )
          .join("\n\n")
      : "No tables defined yet.";

  return `${SCHEMA_AGENT_SYSTEM_PROMPT}

## Current Database Schema

${schemaList}

Remember: Respond only with valid JSON. Use the exact field types specified (string, number, boolean, date, relation).`;
}

/**
 * Examples of good schema responses
 */
export const SCHEMA_EXAMPLES = {
  createPostsTable: {
    userMessage: "Create a posts table with title and content",
    response: {
      chatMessage:
        "I've created a posts table with title, content, and a created_at timestamp.",
      fileOps: [],
      schemaOps: [
        {
          type: "createTable" as const,
          tableName: "posts",
          fields: [
            { name: "title", type: "string", required: true },
            { name: "content", type: "string", required: true },
            { name: "created_at", type: "date", required: true },
          ],
        },
      ],
    },
  },
  addPublishedField: {
    userMessage: "Add a published boolean to posts",
    response: {
      chatMessage:
        "I've added a 'published' boolean field to the posts table. It defaults to false.",
      fileOps: [],
      schemaOps: [
        {
          type: "addField" as const,
          tableName: "posts",
          field: { name: "published", type: "boolean", required: false },
        },
      ],
    },
  },
  createTodoTable: {
    userMessage: "Create a todo list table",
    response: {
      chatMessage:
        "I've created a tasks table for your todo list with title, description, completion status, and due date.",
      fileOps: [],
      schemaOps: [
        {
          type: "createTable" as const,
          tableName: "tasks",
          fields: [
            { name: "title", type: "string", required: true },
            { name: "description", type: "string", required: false },
            { name: "completed", type: "boolean", required: false },
            { name: "due_date", type: "date", required: false },
            { name: "created_at", type: "date", required: true },
          ],
        },
      ],
    },
  },
};
