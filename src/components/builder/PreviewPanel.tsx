"use client";

import { SystemStatus } from "@/lib/types";

interface PreviewPanelProps {
  previewUrl: string | null;
  status: SystemStatus;
  error: string | null;
}

function SyncingOverlay({ status }: { status: SystemStatus }) {
  if (status.state !== "syncing" && status.state !== "compiling") {
    return null;
  }

  return (
    <div className="absolute top-0 left-0 right-0 z-10 bg-amber-500/90 text-black px-3 md:px-4 py-2 flex items-center gap-2 md:gap-3 shadow-lg">
      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin shrink-0" />
      <span className="font-medium text-xs md:text-sm">
        {status.state === "syncing" && "Syncing..."}
        {status.state === "compiling" && "Compiling..."}
      </span>
      <span className="text-xs opacity-75 hidden sm:inline">Preview will update automatically</span>
    </div>
  );
}

export function PreviewPanel({ previewUrl, status, error }: PreviewPanelProps) {
  // Show loading states
  if (
    status.state === "booting" ||
    status.state === "installing" ||
    status.state === "starting"
  ) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
          <div className="text-zinc-400 text-lg mb-2">
            {status.state === "booting" && "Starting WebContainer..."}
            {status.state === "installing" && "Installing dependencies..."}
            {status.state === "starting" && "Starting dev server..."}
          </div>
          <div className="text-zinc-500 text-sm">
            This may take a few moments on first load
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (status.state === "error" || error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950">
        <div className="text-center max-w-md">
          <div className="mb-4">
            <svg
              className="w-12 h-12 text-red-500 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="text-red-400 text-lg mb-2">Preview Error</div>
          <div className="text-zinc-500 text-sm">
            {error || (status.state === "error" ? status.message : "Unknown error")}
          </div>
        </div>
      </div>
    );
  }

  // Show preview iframe
  if (previewUrl) {
    return (
      <div className="flex-1 flex flex-col bg-white relative">
        <SyncingOverlay status={status} />
        <iframe
          src={previewUrl}
          className="flex-1 w-full border-0"
          title="Preview"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      </div>
    );
  }

  // Show idle state
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950">
      <div className="text-center">
        <div className="text-zinc-500 text-lg">Preview will appear here</div>
      </div>
    </div>
  );
}
