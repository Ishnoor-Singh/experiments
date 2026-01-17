"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  status?: "success" | "error" | "pending" | "streaming";
  error?: string;
  onRetry?: () => void;
}

/**
 * Remove any technical content (code blocks, JSON, file paths) from text
 * This ensures non-technical users never see raw code
 */
function sanitizeForNonTechnicalUsers(text: string): string {
  let clean = text;

  // Remove JSON code blocks
  clean = clean.replace(/```json[\s\S]*?```/g, "");

  // Remove any code blocks
  clean = clean.replace(/```[\s\S]*?```/g, "");

  // Remove inline code that looks like file paths
  clean = clean.replace(/`[^`]*\.(tsx?|jsx?|ts|js|json)`/g, "");

  // Remove file paths
  clean = clean.replace(/\/\w+\/[\w./]+\.(tsx?|jsx?|ts|js)/g, "");

  // Remove common technical terms in context
  clean = clean.replace(/I (created|updated|modified) (the )?`[^`]+`/gi, "I made some changes");

  // Clean up multiple newlines
  clean = clean.replace(/\n{3,}/g, "\n\n");

  return clean.trim();
}

/**
 * Simple markdown parser for assistant messages
 * Handles: **bold**, - lists, newlines
 * Also filters out any technical content for non-technical users
 */
function parseMarkdown(text: string): React.ReactNode[] {
  // First, sanitize the text to remove any technical content
  const sanitizedText = sanitizeForNonTechnicalUsers(text);

  const lines = sanitizedText.split("\n");
  const result: React.ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip lines that look like code or technical output
    if (line.startsWith("{") || line.startsWith("}") ||
        line.includes("\"type\":") || line.includes("\"path\":") ||
        line.match(/^\s*[\[\]{}]\s*$/)) {
      continue;
    }

    // Handle list items
    if (line.startsWith("- ")) {
      const listContent = parseInlineMarkdown(line.slice(2));
      result.push(
        <div key={i} className="flex gap-2">
          <span className="text-indigo-400">•</span>
          <span>{listContent}</span>
        </div>
      );
    } else if (line.trim() === "") {
      // Empty line = paragraph break
      result.push(<div key={i} className="h-2" />);
    } else {
      // Regular line with inline formatting
      result.push(
        <div key={i}>{parseInlineMarkdown(line)}</div>
      );
    }
  }

  return result;
}

/**
 * Parse inline markdown (bold only for now)
 */
function parseInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    // Add the bold text
    parts.push(
      <strong key={match.index} className="font-semibold text-white">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function MessageBubble({
  role,
  content,
  status,
  error,
  onRetry,
}: MessageBubbleProps) {
  const isUser = role === "user";
  const isPending = status === "pending";
  const isStreaming = status === "streaming";
  const isError = status === "error";

  // Parse markdown for assistant messages
  const renderedContent = useMemo(() => {
    if (isUser || !content) {
      return content;
    }
    return parseMarkdown(content);
  }, [content, isUser]);

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm",
          isUser
            ? "bg-indigo-600 text-white"
            : "bg-zinc-800 text-zinc-100",
          isPending && "opacity-70",
          isError && "border border-red-500/50"
        )}
      >
        <div className={cn(
          "break-words",
          isUser ? "whitespace-pre-wrap" : ""
        )}>
          {renderedContent || (isStreaming ? "" : "")}
        </div>

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-indigo-400">
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            {!content && <span className="ml-1">Thinking...</span>}
          </div>
        )}

        {/* Pending indicator for user messages */}
        {isPending && (
          <div className="flex items-center gap-1.5 mt-2 text-xs opacity-70">
            <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
            <span>Sending...</span>
          </div>
        )}

        {isError && error && (
          <div className="mt-2 pt-2 border-t border-red-500/30">
            <p className="text-xs text-red-400 mb-2">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="text-xs text-red-300 hover:text-red-200 underline"
              >
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
