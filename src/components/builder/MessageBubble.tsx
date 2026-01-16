"use client";

import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  status?: "success" | "error" | "pending";
  error?: string;
  onRetry?: () => void;
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
  const isError = status === "error";

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
        <div className="whitespace-pre-wrap break-words">{content}</div>

        {isPending && (
          <div className="flex items-center gap-1.5 mt-2 text-xs opacity-70">
            <div className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
            <span>Thinking...</span>
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
