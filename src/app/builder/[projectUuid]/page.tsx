"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { StatusBar } from "@/components/builder/StatusBar";
import { PreviewPanel } from "@/components/builder/PreviewPanel";
import { InspectPanel } from "@/components/builder/InspectPanel";
import { ChatPanel } from "@/components/builder/ChatPanel";
import { useWebContainer } from "@/hooks/useWebContainer";
import Link from "next/link";

export default function BuilderProjectPage() {
  const params = useParams();
  const projectUuid = params.projectUuid as string;

  const project = useQuery(api.projects.getByUuid, { uuid: projectUuid });
  const files = useQuery(api.projectFiles.listByProject, { projectUuid });

  const { status, previewUrl, error } = useWebContainer(projectUuid, files);

  if (project === undefined) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-zinc-400">Loading project...</div>
      </div>
    );
  }

  if (project === null) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="text-zinc-400">Project not found</div>
        <Link
          href="/builder"
          className="text-indigo-400 hover:text-indigo-300"
        >
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Status Bar */}
      <StatusBar status={status} projectName={project.name} />

      {/* Main Content - Three Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel (Left) */}
        <div className="w-80 border-r border-zinc-800 flex flex-col">
          <ChatPanel projectUuid={projectUuid} />
        </div>

        {/* Preview Panel (Center) */}
        <div className="flex-1 flex flex-col">
          <PreviewPanel
            previewUrl={previewUrl}
            status={status}
            error={error}
          />
        </div>

        {/* Inspect Panel (Right) */}
        <div className="w-80 border-l border-zinc-800 flex flex-col">
          <InspectPanel projectUuid={projectUuid} />
        </div>
      </div>
    </>
  );
}
