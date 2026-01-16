"use client";

interface ChatPanelProps {
  projectUuid: string;
}

export function ChatPanel({ projectUuid }: ChatPanelProps) {
  // Phase 2 - For now, just show a placeholder
  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="h-12 border-b border-zinc-800 flex items-center px-4">
        <span className="font-medium text-sm">Chat</span>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="text-center text-zinc-500 text-sm">
          <p className="mb-2">Chat functionality coming in Phase 2</p>
          <p className="text-xs text-zinc-600">
            You&apos;ll be able to describe what you want to build here
          </p>
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-zinc-800">
        <div className="relative">
          <input
            type="text"
            placeholder="Describe what you want to build..."
            disabled
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </div>
  );
}
