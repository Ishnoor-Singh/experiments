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
    <div className="flex-1 flex flex-col">
      {/* Tabs */}
      <div className="h-12 border-b border-zinc-800 flex items-center px-2">
        <button
          onClick={() => setActiveTab("files")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            activeTab === "files"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-white"
          }`}
        >
          Files
        </button>
        <button
          onClick={() => setActiveTab("schema")}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            activeTab === "schema"
              ? "bg-zinc-700 text-white"
              : "text-zinc-400 hover:text-white"
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
