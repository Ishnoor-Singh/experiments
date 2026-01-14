"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SendIcon, Loader2Icon, SparklesIcon, RocketIcon, BotIcon } from "lucide-react";

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
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
            <RocketIcon className="w-10 h-10 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-xl bg-card border-2 border-background flex items-center justify-center">
            <SparklesIcon className="w-4 h-4 text-amber-500" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">Welcome to Experiment Builder</h2>
        <p className="text-sm text-center max-w-md">
          Select an existing experiment from the sidebar or create a new one to start building your app with AI agents.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-background to-muted/20">
      {/* Active Agent Banner */}
      {activeAgent && (
        <div className="px-4 py-3 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <BotIcon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-500 rounded-full animate-pulse" />
          </div>
          <div>
            <span className="text-sm font-medium">{activeAgent.name}</span>
            <span className="text-xs text-muted-foreground ml-2">is working...</span>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.length === 0 && !streamingContent && (
            <div className="text-center py-12">
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-muted flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Describe the app you want to build and the AI agents will help you create it!
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-bubble flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border shadow-sm rounded-bl-md"
                }`}
              >
                {msg.agentName && (
                  <div className={`text-xs font-medium mb-2 flex items-center gap-1.5 ${
                    msg.role === "user" ? "opacity-80" : "text-primary"
                  }`}>
                    <BotIcon className="w-3 h-3" />
                    {msg.agentName}
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
              </div>
            </div>
          ))}

          {/* Streaming content */}
          {streamingContent && (
            <div className="message-bubble flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-md p-4 bg-card border shadow-sm">
                {activeAgent && (
                  <div className="text-xs font-medium mb-2 text-primary flex items-center gap-1.5">
                    <BotIcon className="w-3 h-3" />
                    {activeAgent.name}
                  </div>
                )}
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {streamingContent}
                  <span className="inline-block w-2 h-4 ml-0.5 bg-primary/60 animate-pulse rounded-sm" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t bg-card/50 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe the app you want to build..."
                disabled={isStreaming}
                className="pr-4 py-6 rounded-xl bg-background border-2 focus:border-primary transition-colors"
              />
            </div>
            <Button
              type="submit"
              disabled={isStreaming || !input.trim()}
              size="lg"
              className="rounded-xl h-[52px] px-5 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              {isStreaming ? (
                <Loader2Icon className="w-5 h-5 animate-spin" />
              ) : (
                <SendIcon className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send • AI agents will plan and generate your app
          </p>
        </form>
      </div>
    </div>
  );
}
