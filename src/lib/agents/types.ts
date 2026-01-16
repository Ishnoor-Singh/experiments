// Agent System Types

/**
 * File operation types for modifying project files
 */
export type FileOp =
  | { type: "create"; path: string; content: string }
  | { type: "update"; path: string; content: string }
  | { type: "delete"; path: string };

/**
 * Schema field definition
 */
export interface SchemaField {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "relation";
  required: boolean;
  relationTo?: string;
}

/**
 * Schema operation types for modifying app schemas
 */
export type SchemaOp =
  | { type: "createTable"; tableName: string; fields: SchemaField[] }
  | { type: "addField"; tableName: string; field: SchemaField }
  | { type: "removeField"; tableName: string; fieldName: string }
  | { type: "deleteTable"; tableName: string };

/**
 * Error information returned by agent
 */
export interface AgentError {
  message: string;
  suggestion?: string;
  retryable: boolean;
}

/**
 * Result returned by an agent after processing a message
 */
export interface AgentResult {
  chatMessage: string;
  fileOps: FileOp[];
  schemaOps: SchemaOp[];
  status: "success" | "error";
  error?: AgentError;
}

/**
 * Context passed to agents for processing
 */
export interface AgentContext {
  projectUuid: string;
  userMessage: string;
  conversationHistory: ConversationMessage[];
  currentFiles: ProjectFile[];
  currentSchemas: AppSchema[];
}

/**
 * Message in conversation history
 */
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/**
 * Project file from database
 */
export interface ProjectFile {
  path: string;
  content: string;
}

/**
 * App schema from database
 */
export interface AppSchema {
  key: string;
  tableName: string;
  fields: SchemaField[];
}

/**
 * Agent interface - all agents must implement this
 */
export interface Agent {
  name: string;
  description: string;
  process(context: AgentContext): Promise<AgentResult>;
}

/**
 * Validation result for file operations
 */
export interface FileOpValidation {
  valid: boolean;
  errors: string[];
}

/**
 * Validation result for schema operations
 */
export interface SchemaOpValidation {
  valid: boolean;
  errors: string[];
}
