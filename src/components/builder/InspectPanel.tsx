"use client";

import { useState } from "react";
import { FileExplorer } from "./FileExplorer";
import { SchemaView } from "./SchemaView";

interface InspectPanelProps {
  projectUuid: string;
}

type Tab = "files" | "schema";

export function InspectPanel({ projectUuid }: InspectPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>("files");

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Tabs - adjusted for mobile */}
      <div className="h-12 border-b border-zinc-800 flex items-center px-2 md:px-2 shrink-0">
        <button
          onClick={() => setActiveTab("files")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors touch-manipulation ${
            activeTab === "files"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-white active:bg-zinc-800"
          }`}
        >
          Files
        </button>
        <button
          onClick={() => setActiveTab("schema")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors touch-manipulation ${
            activeTab === "schema"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-white active:bg-zinc-800"
          }`}
        >
          Schema
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "files" ? (
          <FileExplorer projectUuid={projectUuid} />
        ) : (
          <SchemaView projectUuid={projectUuid} />
        )}
      </div>
    </div>
  );
}
