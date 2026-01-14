"use client";

import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2Icon, CircleIcon, Loader2Icon, AlertCircleIcon, Activity, Bot, FileCode, FolderCode, ZapIcon } from "lucide-react";
import { ActivityFeed } from "./ActivityFeed";
import { SpecViewer } from "./SpecViewer";
import { FileViewer } from "./FileViewer";

interface Agent {
  id: string;
  role: string;
  name: string;
  status: "idle" | "working" | "waiting" | "completed" | "error";
  description: string;
}

interface AgentPanelProps {
  agents: Agent[];
  currentPhase: string;
  experimentId?: string | null;
  width?: number;
}

const statusIcons = {
  idle: CircleIcon,
  working: Loader2Icon,
  waiting: Loader2Icon,
  completed: CheckCircle2Icon,
  error: AlertCircleIcon,
};

const statusColors = {
  idle: "text-muted-foreground",
  working: "text-amber-500",
  waiting: "text-blue-500",
  completed: "text-emerald-500",
  error: "text-red-500",
};

const statusBgColors = {
  idle: "",
  working: "bg-amber-500/10",
  waiting: "bg-blue-500/10",
  completed: "bg-emerald-500/10",
  error: "bg-red-500/10",
};

export function AgentPanel({ agents, currentPhase, experimentId, width = 320 }: AgentPanelProps) {
  const [activeTab, setActiveTab] = useState("agents");

  // Group agents by category
  const planningAgents = agents.filter((a) =>
    ["orchestrator", "user-interview", "ux-design", "frontend", "backend-database", "backend-api", "backend-logic", "backend-infra", "principal-developer"].includes(a.role)
  );

  const codegenAgents = agents.filter((a) =>
    ["code-orchestrator", "schema-generator", "api-generator", "component-generator", "integration-agent"].includes(a.role)
  );

  const testingAgents = agents.filter((a) =>
    ["test-generator", "evaluator", "debugger"].includes(a.role)
  );

  // Count active agents
  const workingCount = agents.filter(a => a.status === "working").length;
  const completedCount = agents.filter(a => a.status === "completed").length;

  const renderAgentGroup = (title: string, agentList: Agent[], emoji: string) => (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-sm">{emoji}</span>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {title}
        </h3>
        <span className="text-xs text-muted-foreground">
          ({agentList.filter(a => a.status === "completed").length}/{agentList.length})
        </span>
      </div>
      <div className="space-y-1">
        {agentList.map((agent) => {
          const Icon = statusIcons[agent.status];
          const isActive = agent.status === "working";
          return (
            <div
              key={agent.id}
              className={`
                flex items-center gap-2.5 p-2.5 rounded-xl transition-all duration-300
                ${statusBgColors[agent.status]}
                ${isActive ? "shadow-sm ring-1 ring-amber-500/20" : "hover:bg-muted/50"}
              `}
            >
              <div className={`relative ${isActive ? "status-working" : ""}`}>
                <Icon
                  className={`w-4 h-4 ${statusColors[agent.status]} ${
                    agent.status === "working" ? "animate-spin" : ""
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm truncate ${isActive ? "font-medium" : ""}`}>
                  {agent.name}
                </div>
              </div>
              {isActive && (
                <span className="text-xs text-amber-600 dark:text-amber-400 animate-pulse">
                  working
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className="border-l bg-card/50 backdrop-blur-sm flex flex-col h-full"
      style={{ width }}
    >
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-l from-primary/5 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <ZapIcon className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-semibold text-sm">Status</h2>
          </div>
          {workingCount > 0 && (
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs rounded-full animate-pulse">
              {workingCount} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="capitalize px-2 py-0.5 bg-muted rounded-md">
            📍 {currentPhase}
          </span>
          <span className="text-emerald-600 dark:text-emerald-400">
            ✓ {completedCount} done
          </span>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsList className="grid w-full grid-cols-4 p-1 mx-2 mt-2 bg-muted/50 rounded-xl" style={{ width: "calc(100% - 16px)" }}>
          <TabsTrigger value="agents" className="text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Bot className="h-3.5 w-3.5 mr-1.5" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="specs" className="text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FileCode className="h-3.5 w-3.5 mr-1.5" />
            Specs
          </TabsTrigger>
          <TabsTrigger value="files" className="text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FolderCode className="h-3.5 w-3.5 mr-1.5" />
            Files
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Activity className="h-3.5 w-3.5 mr-1.5" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-3">
              {renderAgentGroup("Planning", planningAgents, "🎯")}
              {renderAgentGroup("Code Generation", codegenAgents, "⚡")}
              {renderAgentGroup("Testing", testingAgents, "🧪")}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="specs" className="flex-1 mt-0 overflow-hidden">
          <SpecViewer experimentId={experimentId || null} />
        </TabsContent>

        <TabsContent value="files" className="flex-1 mt-0 overflow-hidden">
          <FileViewer experimentId={experimentId || null} />
        </TabsContent>

        <TabsContent value="activity" className="flex-1 mt-0 overflow-hidden">
          <ActivityFeed experimentId={experimentId || null} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
