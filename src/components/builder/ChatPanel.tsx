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
  const createMessage = useMutation(api.messages.create);
  const updateMessageStatus = useMutation(api.messages.updateStatus);

  // Check if any message is pending
  const hasPendingMessage = messages?.some((m) => m.status === "pending");

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages?.length]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      // Create user message with pending status
      await createMessage({
        projectUuid,
        role: "user",
        content,
        status: "pending",
      });

      // TODO: In Phase 2.2, this will trigger the agent execution framework
      // For now, we'll just mark the message as success after a delay
      // This simulates the flow without actual agent processing
    },
    [projectUuid, createMessage]
  );

  const handleRetry = useCallback(
    async (messageId: Id<"messages">) => {
      await updateMessageStatus({
        id: messageId,
        status: "pending",
        error: undefined,
      });
      // TODO: In Phase 2.2, trigger agent re-execution
    },
    [updateMessageStatus]
  );

  // Sort messages by timestamp
  const sortedMessages = messages
    ? [...messages].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0))
    : [];

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="h-12 border-b border-zinc-800 flex items-center px-4 shrink-0">
        <span className="font-medium text-sm">Chat</span>
        {hasPendingMessage && (
          <div className="ml-2 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages === undefined ? (
          <div className="text-center text-zinc-500 text-sm">
            Loading messages...
          </div>
        ) : sortedMessages.length === 0 ? (
          <div className="text-center text-zinc-500 text-sm py-8">
            <p className="mb-2">No messages yet</p>
            <p className="text-xs text-zinc-600">
              Describe what you want to build to get started
            </p>
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
                message.status === "error"
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
