import type {
  Agent,
  AgentContext,
  AgentResult,
  FileOp,
  SchemaOp,
} from "./types";
import { validateFileOps, validateSchemaOps } from "./validation";

/**
 * Default timeout for agent execution (30 seconds)
 */
const DEFAULT_TIMEOUT_MS = 30000;

/**
 * Execute an agent with the given context
 * Handles validation, timeout, and error handling
 */
export async function executeAgent(
  agent: Agent,
  context: AgentContext,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<AgentResult> {
  try {
    // Create timeout promise
    const timeoutPromise = new Promise<AgentResult>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Agent execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Race between agent execution and timeout
    const result = await Promise.race([
      agent.process(context),
      timeoutPromise,
    ]);

    // Validate file operations
    if (result.fileOps.length > 0) {
      const fileValidation = validateFileOps(result.fileOps, context.currentFiles);
      if (!fileValidation.valid) {
        return {
          chatMessage: "I encountered an error while preparing file changes.",
          fileOps: [],
          schemaOps: [],
          status: "error",
          error: {
            message: `File operation validation failed: ${fileValidation.errors.join(", ")}`,
            suggestion: "Please try rephrasing your request.",
            retryable: true,
          },
        };
      }
    }

    // Validate schema operations
    if (result.schemaOps.length > 0) {
      const schemaValidation = validateSchemaOps(result.schemaOps, context.currentSchemas);
      if (!schemaValidation.valid) {
        return {
          chatMessage: "I encountered an error while preparing schema changes.",
          fileOps: [],
          schemaOps: [],
          status: "error",
          error: {
            message: `Schema operation validation failed: ${schemaValidation.errors.join(", ")}`,
            suggestion: "Please try rephrasing your request.",
            retryable: true,
          },
        };
      }
    }

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const isTimeout = errorMessage.includes("timed out");

    return {
      chatMessage: isTimeout
        ? "Sorry, the request took too long to process."
        : "Sorry, I encountered an error while processing your request.",
      fileOps: [],
      schemaOps: [],
      status: "error",
      error: {
        message: errorMessage,
        suggestion: isTimeout
          ? "Try a simpler request, or try again."
          : "Please try again or rephrase your request.",
        retryable: true,
      },
    };
  }
}

/**
 * Sanitize file operations - ensure paths are safe
 */
export function sanitizeFileOps(ops: FileOp[]): FileOp[] {
  return ops.map((op) => ({
    ...op,
    path: op.path
      .replace(/\.\./g, "") // Remove path traversal
      .replace(/^\/+/, "") // Remove leading slashes
      .replace(/\/+/g, "/"), // Normalize multiple slashes
  }));
}

/**
 * Sanitize schema operations - ensure names are safe
 */
export function sanitizeSchemaOps(ops: SchemaOp[]): SchemaOp[] {
  return ops.map((op) => {
    switch (op.type) {
      case "createTable":
        return {
          ...op,
          tableName: op.tableName.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
          fields: op.fields.map((f) => ({
            ...f,
            name: f.name.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
          })),
        };
      case "addField":
        return {
          ...op,
          tableName: op.tableName.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
          field: {
            ...op.field,
            name: op.field.name.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
          },
        };
      case "removeField":
        return {
          ...op,
          tableName: op.tableName.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
          fieldName: op.fieldName.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        };
      case "deleteTable":
        return {
          ...op,
          tableName: op.tableName.toLowerCase().replace(/[^a-z0-9_]/g, "_"),
        };
      default:
        return op;
    }
  });
}

/**
 * Create error result helper
 */
export function createErrorResult(
  message: string,
  suggestion?: string,
  retryable: boolean = true
): AgentResult {
  return {
    chatMessage: message,
    fileOps: [],
    schemaOps: [],
    status: "error",
    error: {
      message,
      suggestion,
      retryable,
    },
  };
}

/**
 * Create success result helper
 */
export function createSuccessResult(
  chatMessage: string,
  fileOps: FileOp[] = [],
  schemaOps: SchemaOp[] = []
): AgentResult {
  return {
    chatMessage,
    fileOps,
    schemaOps,
    status: "success",
  };
}
