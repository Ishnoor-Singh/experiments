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
import { useResizable } from "@/hooks/useResizable";
import { useIsMobile, useIsTablet } from "@/hooks/useMediaQuery";
import { MenuIcon, PanelLeftIcon, PanelRightIcon, XIcon } from "lucide-react";

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
  // Only track jobs that were started in this session (via currentJobId)
  useEffect(() => {
    if (currentJobId && currentJob) {
      if (currentJob.status === "pending" || currentJob.status === "running") {
        setIsProcessing(true);
      } else {
        setIsProcessing(false);
        // Clear job ID when complete
        if (currentJob.status === "completed" || currentJob.status === "failed") {
          setCurrentJobId(null);
        }
      }
    } else if (!currentJobId) {
      // No job being tracked, ensure processing is false
      setIsProcessing(false);
    }
  }, [currentJob, currentJobId]);

  // Reset processing state when switching experiments
  useEffect(() => {
    setIsProcessing(false);
    setCurrentJobId(null);
    setAgentStatuses({});
  }, [selectedExperimentId]);

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

  // Responsive state
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(!isMobile);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(!isMobile);

  // Resizable sidebars
  const leftSidebar = useResizable({
    defaultWidth: 280,
    minWidth: 200,
    maxWidth: 400,
    storageKey: "sidebar-left-width",
    side: "left",
  });

  const rightSidebar = useResizable({
    defaultWidth: 320,
    minWidth: 240,
    maxWidth: 480,
    storageKey: "sidebar-right-width",
    side: "right",
  });

  // Auto-close sidebars on mobile
  useEffect(() => {
    if (isMobile) {
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    } else {
      setLeftSidebarOpen(true);
      setRightSidebarOpen(true);
    }
  }, [isMobile]);

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
    <div className="h-screen flex bg-background overflow-hidden">
      {/* Mobile overlay */}
      {isMobile && (leftSidebarOpen || rightSidebarOpen) && (
        <div
          className="mobile-overlay visible"
          onClick={() => {
            setLeftSidebarOpen(false);
            setRightSidebarOpen(false);
          }}
        />
      )}

      {/* Mobile header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 h-14 bg-card border-b z-30 flex items-center justify-between px-4">
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {leftSidebarOpen ? <XIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
          <span className="font-semibold text-sm">Experiment Builder</span>
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            {rightSidebarOpen ? <XIcon className="w-5 h-5" /> : <PanelRightIcon className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* Left Sidebar - Experiments */}
      <div
        className={`
          ${isMobile ? "fixed left-0 top-14 bottom-0 z-50" : "relative"}
          ${isMobile && !leftSidebarOpen ? "-translate-x-full" : "translate-x-0"}
          transition-transform duration-300 ease-out
          flex-shrink-0
        `}
        style={{ width: isMobile ? 280 : leftSidebarOpen ? leftSidebar.width : 0 }}
      >
        {(leftSidebarOpen || !isMobile) && (
          <>
            <ExperimentSidebar
              experiments={formattedExperiments}
              selectedId={selectedExperimentId}
              onSelect={(id) => {
                setSelectedExperimentId(id);
                if (isMobile) setLeftSidebarOpen(false);
              }}
              onNew={handleNewExperiment}
              width={isMobile ? 280 : leftSidebar.width}
            />
            {!isMobile && leftSidebarOpen && (
              <div
                className={`resize-handle resize-handle-left ${leftSidebar.isResizing ? "active" : ""}`}
                onMouseDown={leftSidebar.handleMouseDown}
              />
            )}
          </>
        )}

        {/* Left sidebar toggle (desktop only) */}
        {!isMobile && (
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className={`
              absolute top-1/2 -translate-y-1/2 z-20
              ${leftSidebarOpen ? "right-0 translate-x-1/2" : "right-0 translate-x-full"}
              w-6 h-12 flex items-center justify-center
              bg-card border border-border rounded-r-lg
              hover:bg-accent transition-colors
              shadow-sm
            `}
          >
            <PanelLeftIcon className={`w-4 h-4 transition-transform ${leftSidebarOpen ? "" : "rotate-180"}`} />
          </button>
        )}
      </div>

      {/* Center - Chat Interface */}
      <div className={`flex-1 min-w-0 ${isMobile ? "pt-14" : ""}`}>
        <ChatInterface
          experimentId={selectedExperimentId}
          messages={formattedMessages}
          onSendMessage={handleSendMessage}
          isStreaming={isProcessing}
          streamingContent=""
          activeAgent={activeAgent}
        />
      </div>

      {/* Right Panel - Agent Status */}
      <div
        className={`
          ${isMobile ? "fixed right-0 top-14 bottom-0 z-50" : "relative"}
          ${isMobile && !rightSidebarOpen ? "translate-x-full" : "translate-x-0"}
          transition-transform duration-300 ease-out
          flex-shrink-0
        `}
        style={{ width: isMobile ? 320 : rightSidebarOpen ? rightSidebar.width : 0 }}
      >
        {/* Right sidebar toggle (desktop only) */}
        {!isMobile && (
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className={`
              absolute top-1/2 -translate-y-1/2 z-20
              ${rightSidebarOpen ? "left-0 -translate-x-1/2" : "left-0 -translate-x-full"}
              w-6 h-12 flex items-center justify-center
              bg-card border border-border rounded-l-lg
              hover:bg-accent transition-colors
              shadow-sm
            `}
          >
            <PanelRightIcon className={`w-4 h-4 transition-transform ${rightSidebarOpen ? "" : "rotate-180"}`} />
          </button>
        )}

        {(rightSidebarOpen || !isMobile) && (
          <>
            {!isMobile && rightSidebarOpen && (
              <div
                className={`resize-handle resize-handle-right ${rightSidebar.isResizing ? "active" : ""}`}
                onMouseDown={rightSidebar.handleMouseDown}
              />
            )}
            <AgentPanel
              agents={agents}
              currentPhase={currentPhase}
              experimentId={selectedExperimentId}
              width={isMobile ? 320 : rightSidebar.width}
            />
          </>
        )}
      </div>

      {/* New Experiment Dialog */}
      <NewExperimentDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onCreate={handleCreateExperiment}
      />
    </div>
  );
}
