"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../../../convex/_generated/api";
import { StatusBar } from "@/components/builder/StatusBar";
import { PreviewPanel } from "@/components/builder/PreviewPanel";
import { InspectPanel } from "@/components/builder/InspectPanel";
import { ChatPanel } from "@/components/builder/ChatPanel";
import { useWebContainer } from "@/hooks/useWebContainer";
import Link from "next/link";

// Register the COI service worker to enable cross-origin isolation
function useCOIServiceWorker() {
  const [isReady, setIsReady] = useState(false);
  const [needsReload, setNeedsReload] = useState(false);

  useEffect(() => {
    // Check if already cross-origin isolated
    if (window.crossOriginIsolated) {
      setIsReady(true);
      return;
    }

    // Check if service workers are supported
    if (!("serviceWorker" in navigator)) {
      console.warn("Service workers not supported, cross-origin isolation may not work");
      setIsReady(true);
      return;
    }

    // Register the COI service worker
    navigator.serviceWorker
      .register("/coi-serviceworker.js")
      .then((registration) => {
        console.log("COI Service Worker registered:", registration);

        // If the service worker is installing or waiting, we need to reload
        if (registration.installing || registration.waiting) {
          setNeedsReload(true);
        } else if (registration.active) {
          // Service worker is active but page wasn't loaded through it
          // Need to reload to get the headers applied
          if (!window.crossOriginIsolated) {
            setNeedsReload(true);
          } else {
            setIsReady(true);
          }
        }
      })
      .catch((error) => {
        console.error("COI Service Worker registration failed:", error);
        setIsReady(true); // Continue anyway, will show error in WebContainer
      });

    // Listen for controller change (service worker took over)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!window.crossOriginIsolated) {
        window.location.reload();
      }
    });
  }, []);

  // Auto-reload when service worker is ready
  useEffect(() => {
    if (needsReload) {
      // Small delay to ensure service worker is fully active
      const timer = setTimeout(() => {
        window.location.reload();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [needsReload]);

  return { isReady, needsReload };
}

export default function BuilderProjectPage() {
  const params = useParams();
  const projectUuid = params.projectUuid as string;

  // Initialize COI service worker first
  const { isReady: coiReady, needsReload } = useCOIServiceWorker();

  const project = useQuery(api.projects.getByUuid, { uuid: projectUuid });
  const files = useQuery(api.projectFiles.listByProject, { projectUuid });

  // Only initialize WebContainer after COI is ready
  const { status, previewUrl, error } = useWebContainer(
    projectUuid,
    coiReady ? files : undefined
  );

  // Show loading while COI service worker initializes
  if (needsReload || !coiReady) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
          <div className="text-zinc-400">Enabling cross-origin isolation...</div>
          <div className="text-zinc-500 text-sm mt-2">Page will reload automatically</div>
        </div>
      </div>
    );
  }

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
