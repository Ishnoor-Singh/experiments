"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Activity,
  AlertCircle,
  Bot,
  CheckCircle,
  GitBranch,
  Package,
  Wrench
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActivityFeedProps {
  experimentId: string | null;
}

export function ActivityFeed({ experimentId }: ActivityFeedProps) {
  const activities = useQuery(
    api.activities.list,
    experimentId
      ? { experimentId: experimentId as Id<"experiments">, limit: 50 }
      : "skip"
  );

  const stats = useQuery(
    api.activities.stats,
    experimentId ? { experimentId: experimentId as Id<"experiments"> } : "skip"
  );

  if (!experimentId) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Select an experiment to view activities</p>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <Activity className="h-8 w-8 mb-2" />
        <p className="text-sm">No activities yet</p>
        <p className="text-xs mt-1">Activities will appear as agents work</p>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "agent_start":
      case "agent_complete":
        return <Bot className="h-4 w-4" />;
      case "tool_use":
        return <Wrench className="h-4 w-4" />;
      case "phase_change":
        return <GitBranch className="h-4 w-4" />;
      case "block_created":
        return <Package className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "agent_start":
        return "text-blue-500";
      case "agent_complete":
        return "text-green-500";
      case "tool_use":
        return "text-purple-500";
      case "phase_change":
        return "text-yellow-500";
      case "block_created":
        return "text-cyan-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const formatActivityMessage = (activity: any) => {
    switch (activity.type) {
      case "agent_start":
        return `${activity.agentName || activity.agentRole} started`;
      case "agent_complete":
        return `${activity.agentName || activity.agentRole} completed`;
      case "tool_use":
        return `Used ${activity.tool} tool`;
      case "phase_change":
        return `Changed to ${activity.phase} phase`;
      case "block_created":
        return `Created ${activity.blockType} block`;
      case "error":
        return `Error: ${activity.error}`;
      default:
        return "Unknown activity";
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffSecs < 60) {
      return "Just now";
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Stats Header */}
      {stats && (
        <div className="p-3 border-b bg-muted/30">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Total:</span>{" "}
              <span className="font-semibold">{stats.total}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tool Uses:</span>{" "}
              <span className="font-semibold">{stats.toolUses}</span>
            </div>
            {stats.errors > 0 && (
              <div className="col-span-2">
                <span className="text-muted-foreground">Errors:</span>{" "}
                <span className="font-semibold text-red-500">{stats.errors}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Activity List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {activities.map((activity) => (
            <div
              key={activity._id}
              className={cn(
                "flex items-start gap-3 p-2 rounded-lg transition-colors",
                "hover:bg-muted/50"
              )}
            >
              <div className={cn("mt-0.5", getActivityColor(activity.type))}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm break-words">
                  {formatActivityMessage(activity)}
                </p>
                {activity.agentRole && activity.type === "tool_use" && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by {activity.agentRole}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatTimestamp(activity.timestamp)}
                </p>
              </div>
              {activity.type === "agent_complete" && (
                <CheckCircle className="h-3 w-3 text-green-500 mt-1 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}