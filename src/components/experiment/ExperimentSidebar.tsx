"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusIcon } from "lucide-react";

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
}

export function ExperimentSidebar({
  experiments,
  selectedId,
  onSelect,
  onNew,
}: ExperimentSidebarProps) {
  return (
    <div className="w-64 border-r bg-muted/30 flex flex-col h-full">
      <div className="p-4 border-b">
        <Button onClick={onNew} className="w-full" size="sm">
          <PlusIcon className="w-4 h-4 mr-2" />
          New Experiment
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {experiments.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2">
              No experiments yet
            </p>
          ) : (
            experiments.map((exp) => (
              <button
                key={exp._id}
                onClick={() => onSelect(exp._id)}
                className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                  selectedId === exp._id
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                <div className="font-medium truncate">{exp.name}</div>
                <div className="text-xs opacity-70 capitalize">
                  {exp.currentPhase} • {exp.status}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
