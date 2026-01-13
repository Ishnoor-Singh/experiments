"use client";

import { useState } from "react";
import { ExperimentSidebar } from "@/components/experiment/ExperimentSidebar";
import { ChatInterface } from "@/components/experiment/ChatInterface";
import { AgentPanel } from "@/components/experiment/AgentPanel";
import { getAllAgentInfos } from "@/lib/agents/agent-configs";

// Mock data for initial UI
const mockExperiments = [
  {
    _id: "1",
    name: "Todo App",
    status: "planning",
    currentPhase: "requirements",
  },
];

const mockMessages = [
  {
    id: "1",
    role: "user" as const,
    content: "Build a simple todo app with add, complete, and delete functionality",
  },
  {
    id: "2",
    role: "assistant" as const,
    content: "I'll help you build a todo app. Let me gather some requirements first...",
    agentRole: "orchestrator",
    agentName: "Planning Orchestrator",
  },
];

export default function ExperimentBuilder() {
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>("1");
  const [experiments] = useState(mockExperiments);
  const [messages] = useState(mockMessages);
  const [isStreaming] = useState(false);
  const [streamingContent] = useState("");
  const [activeAgent] = useState<{ role: string; name: string } | null>(null);
  const [currentPhase] = useState("requirements");

  const agents = getAllAgentInfos();

  const handleNewExperiment = () => {
    // TODO: Create new experiment via Convex
    console.log("Create new experiment");
  };

  const handleSendMessage = (message: string) => {
    // TODO: Send message to agent via SSE
    console.log("Send message:", message);
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Left Sidebar - Experiments */}
      <ExperimentSidebar
        experiments={experiments}
        selectedId={selectedExperimentId}
        onSelect={setSelectedExperimentId}
        onNew={handleNewExperiment}
      />

      {/* Center - Chat Interface */}
      <ChatInterface
        experimentId={selectedExperimentId}
        messages={messages}
        onSendMessage={handleSendMessage}
        isStreaming={isStreaming}
        streamingContent={streamingContent}
        activeAgent={activeAgent}
      />

      {/* Right Panel - Agent Status */}
      <AgentPanel agents={agents} currentPhase={currentPhase} />
    </div>
  );
}
