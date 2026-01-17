"use client";

import { useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import type { Id } from "../../../convex/_generated/dataModel";

interface ChatPanelProps {
  projectUuid: string;
}

export function ChatPanel({ projectUuid }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(api.messages.listByProject, { projectUuid });
  const sendAndProcess = useMutation(api.messages.sendAndProcess);
  const retryMessage = useMutation(api.retry.retryMessage);

  // Check if any message is pending or streaming
  const hasPendingMessage = messages?.some(
    (m) => m.status === "pending" || m.status === "streaming"
  );

  // Find streaming message to track content updates
  const streamingMessage = messages?.find((m) => m.status === "streaming");

  // Scroll to bottom when new messages arrive or streaming content updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.length, streamingMessage?.content]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      // Send message and trigger AI agent processing
      await sendAndProcess({
        projectUuid,
        content,
      });
    },
    [projectUuid, sendAndProcess]
  );

  const handleRetry = useCallback(
    async (messageId: Id<"messages">) => {
      // Use the proper retry mutation that re-triggers the agent
      await retryMessage({
        projectUuid,
        messageId,
      });
    },
    [projectUuid, retryMessage]
  );

  // Sort messages by timestamp
  const sortedMessages = messages
    ? [...messages].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
    : [];

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header - hidden on mobile since we have tab bar */}
      <div className="h-12 border-b border-zinc-800 items-center px-3 md:px-4 shrink-0 hidden md:flex">
        <span className="font-medium text-sm">Chat</span>
        {hasPendingMessage && (
          <div className="ml-2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3"
      >
        {messages === undefined ? (
          <div className="text-center text-zinc-500 text-sm">
            Loading messages...
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm py-8">
            <p className="mb-3">Welcome! Describe what you want to build:</p>
            <div className="space-y-2 text-xs text-zinc-600">
              <p>&quot;Build me a todo app with add and delete&quot;</p>
              <p>&quot;Create a contact form with name and email&quot;</p>
              <p>&quot;Make a counter with + and - buttons&quot;</p>
            </div>
          </div>
        ) : (
          sortedMessages.map((message) => (
            <MessageBubble
              key={message._id}
              role={message.role}
              content={message.content}
              status={message.status}
              error={message.error}
              onRetry={
                message.role === "user" && message.status === "error"
                  ? () => handleRetry(message._id)
                  : undefined
              }
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <ChatInput onSubmit={handleSendMessage} disabled={hasPendingMessage} />
    </div>
  );
}
