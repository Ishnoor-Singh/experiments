"use client";

import { useState, useCallback, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  disabled = false,
  placeholder = "Describe what you want to build...",
}: ChatInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSubmit(trimmed);
      setValue("");
    }
  }, [value, disabled, onSubmit]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="p-4 border-t border-zinc-800">
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 pr-10",
            "text-sm text-white placeholder:text-zinc-500",
            "focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent",
            "resize-none min-h-[40px] max-h-[120px]",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          style={{
            height: "auto",
            minHeight: "40px",
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "auto";
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !value.trim()}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2",
            "w-7 h-7 rounded-md flex items-center justify-center",
            "text-zinc-400 hover:text-white hover:bg-zinc-700",
            "transition-colors",
            (disabled || !value.trim()) && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-zinc-400"
          )}
          aria-label="Send message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.115A28.897 28.897 0 003.105 2.289z" />
          </svg>
        </button>
      </div>
      <p className="text-xs text-zinc-500 mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
}
