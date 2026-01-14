"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusIcon, FlaskConicalIcon, SparklesIcon } from "lucide-react";

interface Experiment {
  _id: string;
  name: string;
  status: string;
  currentPhase: string;
}

interface ExperimentSidebarProps {
  experiments: Experiment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  width?: number;
}

const phaseEmojis: Record<string, string> = {
  requirements: "📋",
  planning: "🎯",
  design: "🎨",
  development: "🔧",
  testing: "🧪",
  complete: "✨",
};

const statusColors: Record<string, string> = {
  planning: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  active: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  completed: "bg-green-500/20 text-green-600 dark:text-green-400",
  failed: "bg-red-500/20 text-red-600 dark:text-red-400",
};

export function ExperimentSidebar({
  experiments,
  selectedId,
  onSelect,
  onNew,
  width = 280,
}: ExperimentSidebarProps) {
  return (
    <div
      className="border-r bg-card/50 backdrop-blur-sm flex flex-col h-full"
      style={{ width }}
    >
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <FlaskConicalIcon className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">Experiments</span>
        </div>
        <Button onClick={onNew} className="w-full group" size="sm">
          <PlusIcon className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform duration-200" />
          New Experiment
        </Button>
      </div>

      {/* Experiment List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {experiments.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No experiments yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Create one to get started!
              </p>
            </div>
          ) : (
            experiments.map((exp) => (
              <button
                key={exp._id}
                onClick={() => onSelect(exp._id)}
                className={`
                  w-full text-left p-3 rounded-xl text-sm transition-all duration-200
                  ${selectedId === exp._id
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                    : "hover:bg-muted/80 hover:scale-[1.01]"
                  }
                `}
              >
                <div className="flex items-start gap-2">
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {phaseEmojis[exp.currentPhase] || "📦"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{exp.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`
                        text-xs px-1.5 py-0.5 rounded-md capitalize
                        ${selectedId === exp._id
                          ? "bg-primary-foreground/20"
                          : statusColors[exp.status] || "bg-muted"
                        }
                      `}>
                        {exp.status}
                      </span>
                      <span className={`text-xs ${selectedId === exp._id ? "opacity-80" : "text-muted-foreground"}`}>
                        {exp.currentPhase}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer with count */}
      {experiments.length > 0 && (
        <div className="p-3 border-t text-xs text-muted-foreground text-center">
          {experiments.length} experiment{experiments.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
