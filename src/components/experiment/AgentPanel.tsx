"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2Icon, CircleIcon, Loader2Icon, AlertCircleIcon } from "lucide-react";

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
  working: "text-yellow-500",
  waiting: "text-blue-500",
  completed: "text-green-500",
  error: "text-red-500",
};

export function AgentPanel({ agents, currentPhase }: AgentPanelProps) {
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

  return (
    <div className="w-72 border-l bg-muted/30 flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="font-semibold">Agents</h2>
        <p className="text-xs text-muted-foreground capitalize">
          Phase: {currentPhase}
        </p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Planning Agents */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Planning
            </h3>
            <div className="space-y-1">
              {planningAgents.map((agent) => {
                const Icon = statusIcons[agent.status];
                return (
                  <div
                    key={agent.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
                  >
                    <Icon
                      className={`w-4 h-4 ${statusColors[agent.status]} ${
                        agent.status === "working" ? "animate-spin" : ""
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {agent.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Code Generation Agents */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Code Generation
            </h3>
            <div className="space-y-1">
              {codegenAgents.map((agent) => {
                const Icon = statusIcons[agent.status];
                return (
                  <div
                    key={agent.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
                  >
                    <Icon
                      className={`w-4 h-4 ${statusColors[agent.status]} ${
                        agent.status === "working" ? "animate-spin" : ""
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {agent.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Testing Agents */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
              Testing
            </h3>
            <div className="space-y-1">
              {testingAgents.map((agent) => {
                const Icon = statusIcons[agent.status];
                return (
                  <div
                    key={agent.id}
                    className="flex items-center gap-2 p-2 rounded-md hover:bg-muted/50"
                  >
                    <Icon
                      className={`w-4 h-4 ${statusColors[agent.status]} ${
                        agent.status === "working" ? "animate-spin" : ""
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {agent.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
