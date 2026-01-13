"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ExperimentSidebar } from "@/components/experiment/ExperimentSidebar";
import { ChatInterface } from "@/components/experiment/ChatInterface";
import { AgentPanel } from "@/components/experiment/AgentPanel";
import { NewExperimentDialog } from "@/components/experiment/NewExperimentDialog";
import { getAllAgentInfos } from "@/lib/agents/agent-configs";

// SSE Event types from the API
type SSEEvent =
  | { type: "agent_start"; agentRole: string; agentName: string }
  | { type: "text"; content: string; agentRole?: string }
  | { type: "tool_start"; tool: string; input?: unknown; agentRole?: string }
  | { type: "tool_end"; tool: string; agentRole?: string }
  | { type: "phase_change"; phase: string }
  | { type: "agent_end"; agentRole: string; agentName?: string }
  | { type: "error"; message: string }
  | { type: "done" };

export default function ExperimentBuilder() {
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [activeAgent, setActiveAgent] = useState<{ role: string; name: string } | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, "idle" | "working" | "completed">>({});

  const abortControllerRef = useRef<AbortController | null>(null);

  // Convex queries
  const experiments = useQuery(api.experiments.list) ?? [];
  const messages = useQuery(
    api.messages.list,
    selectedExperimentId ? { experimentId: selectedExperimentId as Id<"experiments"> } : "skip"
  ) ?? [];

  const selectedExperiment = experiments.find(e => e._id === selectedExperimentId);
  const currentPhase = selectedExperiment?.currentPhase ?? "requirements";

  // Convex mutations
  const createExperiment = useMutation(api.experiments.create);
  const sendMessage = useMutation(api.messages.send);

  // Get agent infos with status overrides
  const agents = getAllAgentInfos().map(agent => ({
    ...agent,
    status: agentStatuses[agent.role] || agent.status,
  }));

  const handleNewExperiment = () => {
    setShowNewDialog(true);
  };

  const handleCreateExperiment = async (name: string, description?: string) => {
    const id = await createExperiment({ name, description });
    setSelectedExperimentId(id);
    setShowNewDialog(false);
  };

  const handleSendMessage = useCallback(async (message: string) => {
    if (!selectedExperimentId || isStreaming) return;

    // Save user message to Convex
    await sendMessage({
      experimentId: selectedExperimentId as Id<"experiments">,
      role: "user",
      content: message,
    });

    // Reset state
    setIsStreaming(true);
    setStreamingContent("");
    setActiveAgent(null);
    setAgentStatuses({});

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          experimentId: selectedExperimentId,
          message,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let currentAgentContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event: SSEEvent = JSON.parse(line.slice(6));

              switch (event.type) {
                case "agent_start":
                  setActiveAgent({ role: event.agentRole, name: event.agentName });
                  setAgentStatuses(prev => ({ ...prev, [event.agentRole]: "working" }));
                  currentAgentContent = "";
                  break;

                case "text":
                  currentAgentContent += event.content;
                  setStreamingContent(currentAgentContent);
                  break;

                case "agent_end":
                  // Save the agent's response to Convex
                  if (currentAgentContent.trim()) {
                    await sendMessage({
                      experimentId: selectedExperimentId as Id<"experiments">,
                      role: "assistant",
                      content: currentAgentContent.trim(),
                      agentRole: event.agentRole,
                      agentName: event.agentName,
                    });
                  }
                  setAgentStatuses(prev => ({ ...prev, [event.agentRole]: "completed" }));
                  setActiveAgent(null);
                  setStreamingContent("");
                  currentAgentContent = "";
                  break;

                case "error":
                  console.error("SSE Error:", event.message);
                  break;

                case "done":
                  // Stream complete
                  break;
              }
            } catch {
              console.error("Failed to parse SSE event:", line);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("Request aborted");
      } else {
        console.error("Chat error:", error);
      }
    } finally {
      setIsStreaming(false);
      setActiveAgent(null);
      abortControllerRef.current = null;
    }
  }, [selectedExperimentId, isStreaming, sendMessage]);

  // Convert Convex documents to the format expected by components
  const formattedExperiments = experiments.map(exp => ({
    _id: exp._id,
    name: exp.name,
    status: exp.status,
    currentPhase: exp.currentPhase,
  }));

  const formattedMessages = messages.map(msg => ({
    id: msg._id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    agentRole: msg.agentRole,
    agentName: msg.agentName,
  }));

  return (
    <div className="h-screen flex bg-background">
      {/* Left Sidebar - Experiments */}
      <ExperimentSidebar
        experiments={formattedExperiments}
        selectedId={selectedExperimentId}
        onSelect={setSelectedExperimentId}
        onNew={handleNewExperiment}
      />

      {/* Center - Chat Interface */}
      <ChatInterface
        experimentId={selectedExperimentId}
        messages={formattedMessages}
        onSendMessage={handleSendMessage}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        activeAgent={activeAgent}
      />

      {/* Right Panel - Agent Status */}
      <AgentPanel agents={agents} currentPhase={currentPhase} />

      {/* New Experiment Dialog */}
      <NewExperimentDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onCreate={handleCreateExperiment}
      />
    </div>
  );
}
