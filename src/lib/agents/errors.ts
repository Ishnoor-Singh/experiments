/**
 * Error types and handling for the agent system
 */

/**
 * Base error class for agent errors
 */
export class AgentError extends Error {
  public readonly suggestion?: string;
  public readonly retryable: boolean;
  public readonly code: string;

  constructor(
    message: string,
    options: {
      suggestion?: string;
      retryable?: boolean;
      code?: string;
    } = {}
  ) {
    super(message);
    this.name = "AgentError";
    this.suggestion = options.suggestion;
    this.retryable = options.retryable ?? true;
    this.code = options.code ?? "AGENT_ERROR";
  }
}

/**
 * Error when the API rate limit is exceeded
 */
export class RateLimitError extends AgentError {
  constructor(retryAfter?: number) {
    super(
      retryAfter
        ? `Rate limit exceeded. Please try again in ${retryAfter} seconds.`
        : "Rate limit exceeded. Please try again later.",
      {
        suggestion: "Wait a moment before sending another message.",
        retryable: true,
        code: "RATE_LIMIT",
      }
    );
    this.name = "RateLimitError";
  }
}

/**
 * Error when the API key is invalid or missing
 */
export class AuthenticationError extends AgentError {
  constructor() {
    super("API authentication failed.", {
      suggestion: "Please check that the API key is configured correctly.",
      retryable: false,
      code: "AUTH_ERROR",
    });
    this.name = "AuthenticationError";
  }
}

/**
 * Error when the request times out
 */
export class TimeoutError extends AgentError {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs / 1000} seconds.`, {
      suggestion: "Try a simpler request or try again.",
      retryable: true,
      code: "TIMEOUT",
    });
    this.name = "TimeoutError";
  }
}

/**
 * Error when the generated code is invalid
 */
export class CodeValidationError extends AgentError {
  constructor(details: string) {
    super(`Generated code is invalid: ${details}`, {
      suggestion: "Try rephrasing your request more specifically.",
      retryable: true,
      code: "CODE_VALIDATION",
    });
    this.name = "CodeValidationError";
  }
}

/**
 * Error when the schema operation is invalid
 */
export class SchemaValidationError extends AgentError {
  constructor(details: string) {
    super(`Schema operation is invalid: ${details}`, {
      suggestion: "Check the table and field names, and try again.",
      retryable: true,
      code: "SCHEMA_VALIDATION",
    });
    this.name = "SchemaValidationError";
  }
}

/**
 * Error when network request fails
 */
export class NetworkError extends AgentError {
  constructor(originalError?: Error) {
    super(
      originalError?.message || "Network request failed.",
      {
        suggestion: "Check your internet connection and try again.",
        retryable: true,
        code: "NETWORK_ERROR",
      }
    );
    this.name = "NetworkError";
  }
}

/**
 * Error when the AI response cannot be parsed
 */
export class ParseError extends AgentError {
  constructor() {
    super("Could not understand the AI response.", {
      suggestion: "Try rephrasing your request more clearly.",
      retryable: true,
      code: "PARSE_ERROR",
    });
    this.name = "ParseError";
  }
}

/**
 * Parse an error from the Anthropic API response
 */
export function parseAPIError(status: number, body: string): AgentError {
  try {
    const data = JSON.parse(body);
    const message = data.error?.message || body;

    switch (status) {
      case 401:
        return new AuthenticationError();
      case 429:
        const retryAfter = data.error?.retry_after;
        return new RateLimitError(retryAfter);
      case 500:
      case 502:
      case 503:
        return new AgentError("The AI service is temporarily unavailable.", {
          suggestion: "Please try again in a few moments.",
          retryable: true,
          code: "SERVICE_UNAVAILABLE",
        });
      default:
        return new AgentError(message, {
          suggestion: "Please try again.",
          retryable: status >= 500,
          code: `HTTP_${status}`,
        });
    }
  } catch {
    return new AgentError(`API error (${status}): ${body}`, {
      suggestion: "Please try again.",
      retryable: status >= 500,
      code: `HTTP_${status}`,
    });
  }
}

/**
 * Format an error for display to the user
 */
export function formatErrorForUser(error: unknown): {
  message: string;
  suggestion?: string;
  retryable: boolean;
} {
  if (error instanceof AgentError) {
    return {
      message: error.message,
      suggestion: error.suggestion,
      retryable: error.retryable,
    };
  }

  if (error instanceof Error) {
    // Check for common error patterns
    const message = error.message.toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
      return {
        message: "Network error. Please check your connection.",
        suggestion: "Try again when you have a stable internet connection.",
        retryable: true,
      };
    }

    if (message.includes("timeout")) {
      return {
        message: "The request took too long.",
        suggestion: "Try a simpler request.",
        retryable: true,
      };
    }

    return {
      message: error.message,
      suggestion: "Please try again.",
      retryable: true,
    };
  }

  return {
    message: "An unexpected error occurred.",
    suggestion: "Please try again.",
    retryable: true,
  };
}

/**
 * Determine if an error should trigger a retry
 */
export function shouldRetry(error: unknown, attemptNumber: number): boolean {
  const MAX_RETRIES = 3;

  if (attemptNumber >= MAX_RETRIES) {
    return false;
  }

  if (error instanceof AgentError) {
    return error.retryable;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    // Retry on network/timeout errors
    return (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("fetch")
    );
  }

  return false;
}

/**
 * Calculate exponential backoff delay
 */
export function getRetryDelay(attemptNumber: number): number {
  const BASE_DELAY_MS = 1000;
  const MAX_DELAY_MS = 10000;
  const delay = Math.min(
    BASE_DELAY_MS * Math.pow(2, attemptNumber),
    MAX_DELAY_MS
  );
  // Add jitter
  return delay + Math.random() * 1000;
}
