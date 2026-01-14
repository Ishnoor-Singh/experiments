"use client";

import { useState, useCallback, useEffect } from "react";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [agentStatuses, setAgentStatuses] = useState<Record<string, "idle" | "working" | "completed">>({});

  // Convex queries
  const experiments = useQuery(api.experiments.list) ?? [];
  const messages = useQuery(
    api.messages.list,
    selectedExperimentId ? { experimentId: selectedExperimentId as Id<"experiments"> } : "skip"
  ) ?? [];

  // Subscribe to active job status
  const activeJob = useQuery(
    api.jobs.getActiveForExperiment,
    selectedExperimentId ? { experimentId: selectedExperimentId as Id<"experiments"> } : "skip"
  );

  // Subscribe to current job if we have one
  const currentJob = useQuery(
    api.jobs.get,
    currentJobId ? { jobId: currentJobId as Id<"jobs"> } : "skip"
  );

  // Subscribe to activities for agent status updates
  const activities = useQuery(
    api.activities.list,
    selectedExperimentId ? { experimentId: selectedExperimentId as Id<"experiments">, limit: 20 } : "skip"
  ) ?? [];

  const selectedExperiment = experiments.find(e => e._id === selectedExperimentId);
  const currentPhase = selectedExperiment?.currentPhase ?? "requirements";

  // Convex mutations
  const createExperiment = useMutation(api.experiments.create);

  // Update agent statuses based on recent activities
  useEffect(() => {
    if (!activities.length) return;

    const newStatuses: Record<string, "idle" | "working" | "completed"> = {};

    // Process activities to determine current agent statuses
    for (const activity of activities) {
      if (activity.agentRole) {
        if (activity.type === "agent_start") {
          // Only mark as working if this is the most recent activity for this agent
          if (!newStatuses[activity.agentRole]) {
            newStatuses[activity.agentRole] = "working";
          }
        } else if (activity.type === "agent_complete") {
          newStatuses[activity.agentRole] = "completed";
        }
      }
    }

    // If there's an active job, mark working agents
    if (activeJob || (currentJob && (currentJob.status === "pending" || currentJob.status === "running"))) {
      // Find the most recent agent_start without a corresponding agent_complete
      const workingAgents = new Set<string>();
      for (const activity of [...activities].reverse()) {
        if (activity.agentRole) {
          if (activity.type === "agent_start" && !workingAgents.has(activity.agentRole)) {
            newStatuses[activity.agentRole] = "working";
            workingAgents.add(activity.agentRole);
          } else if (activity.type === "agent_complete") {
            workingAgents.add(activity.agentRole);
          }
        }
      }
    }

    setAgentStatuses(newStatuses);
  }, [activities, activeJob, currentJob]);

  // Update processing state based on job status
  useEffect(() => {
    if (currentJob) {
      if (currentJob.status === "pending" || currentJob.status === "running") {
        setIsProcessing(true);
      } else {
        setIsProcessing(false);
        // Clear job ID when complete
        if (currentJob.status === "completed" || currentJob.status === "failed") {
          setCurrentJobId(null);
        }
      }
    } else if (activeJob) {
      setIsProcessing(true);
      setCurrentJobId(activeJob._id);
    } else {
      setIsProcessing(false);
    }
  }, [currentJob, activeJob]);

  // Get agent infos with status overrides
  const agents = getAllAgentInfos().map(agent => ({
    ...agent,
    status: agentStatuses[agent.role] || agent.status,
  }));

  // Find the active agent from recent activities
  const activeAgent = (() => {
    if (!isProcessing) return null;
    // Find the most recent agent_start without a matching agent_complete
    const startedAgents = new Map<string, { role: string; name: string }>();
    const completedAgents = new Set<string>();

    for (const activity of [...activities].reverse()) {
      if (activity.agentRole) {
        if (activity.type === "agent_complete") {
          completedAgents.add(activity.agentRole);
        } else if (activity.type === "agent_start" && !completedAgents.has(activity.agentRole)) {
          return { role: activity.agentRole, name: activity.agentName || activity.agentRole };
        }
      }
    }
    return null;
  })();

  const handleNewExperiment = () => {
    setShowNewDialog(true);
  };

  const handleCreateExperiment = async (name: string, description?: string) => {
    const id = await createExperiment({ name, description });
    setSelectedExperimentId(id);
    setShowNewDialog(false);
  };

  const handleSendMessage = useCallback(async (message: string) => {
    if (!selectedExperimentId || isProcessing) return;

    setIsProcessing(true);
    setAgentStatuses({});

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
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      const result = await response.json();

      if (result.jobId) {
        setCurrentJobId(result.jobId);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setIsProcessing(false);
    }
  }, [selectedExperimentId, isProcessing]);

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
        isStreaming={isProcessing}
        streamingContent=""
        activeAgent={activeAgent}
      />

      {/* Right Panel - Agent Status */}
      <AgentPanel agents={agents} currentPhase={currentPhase} experimentId={selectedExperimentId} />

      {/* New Experiment Dialog */}
      <NewExperimentDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onCreate={handleCreateExperiment}
      />
    </div>
  );
}
