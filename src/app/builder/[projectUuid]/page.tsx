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

type MobileTab = "chat" | "preview" | "inspect";

function MobileTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}) {
  const tabs: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "chat",
      label: "Chat",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      id: "preview",
      label: "Preview",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      id: "inspect",
      label: "Files",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex border-t border-zinc-800 bg-zinc-900 md:hidden">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
            activeTab === tab.id
              ? "text-indigo-400 bg-zinc-800/50"
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          {tab.icon}
          <span className="text-xs font-medium">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

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
  const [mobileTab, setMobileTab] = useState<MobileTab>("chat");

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

      {/* Main Content - Responsive Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Mobile: Show only active tab panel */}
        {/* Desktop: Show all three panels */}

        {/* Chat Panel (Left) */}
        <div
          className={`${
            mobileTab === "chat" ? "flex" : "hidden"
          } md:flex md:w-72 lg:w-80 border-r border-zinc-800 flex-col flex-1 md:flex-none`}
        >
          <ChatPanel projectUuid={projectUuid} />
        </div>

        {/* Preview Panel (Center) */}
        <div
          className={`${
            mobileTab === "preview" ? "flex" : "hidden"
          } md:flex flex-1 flex-col`}
        >
          <PreviewPanel
            previewUrl={previewUrl}
            status={status}
            error={error}
          />
        </div>

        {/* Inspect Panel (Right) */}
        <div
          className={`${
            mobileTab === "inspect" ? "flex" : "hidden"
          } md:flex md:w-72 lg:w-80 border-l border-zinc-800 flex-col flex-1 md:flex-none`}
        >
          <InspectPanel projectUuid={projectUuid} />
        </div>
      </div>

      {/* Mobile Tab Bar */}
      <MobileTabBar activeTab={mobileTab} onTabChange={setMobileTab} />
    </>
  );
}
