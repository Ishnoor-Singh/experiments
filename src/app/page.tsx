"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ExperimentSidebar } from "@/components/experiment/ExperimentSidebar";
import { ChatInterface } from "@/components/experiment/ChatInterface";
import { AgentPanel } from "@/components/experiment/AgentPanel";
import { NewExperimentDialog } from "@/components/experiment/NewExperimentDialog";
import { getAllAgentInfos } from "@/lib/agents/agent-configs";

export default function ExperimentBuilder() {
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [isStreaming] = useState(false);
  const [streamingContent] = useState("");
  const [activeAgent] = useState<{ role: string; name: string } | null>(null);

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

  const agents = getAllAgentInfos();

  const handleNewExperiment = () => {
    setShowNewDialog(true);
  };

  const handleCreateExperiment = async (name: string, description?: string) => {
    const id = await createExperiment({ name, description });
    setSelectedExperimentId(id);
    setShowNewDialog(false);
  };

  const handleSendMessage = async (message: string) => {
    if (!selectedExperimentId) return;

    // Save user message to Convex
    await sendMessage({
      experimentId: selectedExperimentId as Id<"experiments">,
      role: "user",
      content: message,
    });

    // TODO: Send to agent via SSE in Commit 8
    console.log("Send message:", message);
  };

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
