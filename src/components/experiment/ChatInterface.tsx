"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendIcon, Loader2Icon } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  agentRole?: string;
  agentName?: string;
}

interface ChatInterfaceProps {
  experimentId: string | null;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isStreaming: boolean;
  streamingContent: string;
  activeAgent: { role: string; name: string } | null;
}

export function ChatInterface({
  experimentId,
  messages,
  onSendMessage,
  isStreaming,
  streamingContent,
  activeAgent,
}: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isStreaming && experimentId) {
      onSendMessage(input.trim());
      setInput("");
    }
  };

  if (!experimentId) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select or create an experiment to start
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Active Agent Banner */}
      {activeAgent && (
        <div className="px-4 py-2 bg-primary/10 border-b flex items-center gap-2">
          <Loader2Icon className="w-4 h-4 animate-spin" />
          <span className="text-sm font-medium">{activeAgent.name}</span>
          <span className="text-xs text-muted-foreground">is working...</span>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.agentName && (
                  <div className="text-xs font-medium mb-1 opacity-70">
                    {msg.agentName}
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              </div>
            </div>
          ))}

          {/* Streaming content */}
          {streamingContent && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                {activeAgent && (
                  <div className="text-xs font-medium mb-1 opacity-70">
                    {activeAgent.name}
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap">
                  {streamingContent}
                  <span className="animate-pulse">▊</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2 max-w-3xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the app you want to build..."
            disabled={isStreaming}
            className="flex-1"
          />
          <Button type="submit" disabled={isStreaming || !input.trim()}>
            {isStreaming ? (
              <Loader2Icon className="w-4 h-4 animate-spin" />
            ) : (
              <SendIcon className="w-4 h-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
