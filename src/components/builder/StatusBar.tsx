"use client";

import { SystemStatus } from "@/lib/types";
import Link from "next/link";

interface StatusBarProps {
  status: SystemStatus;
  projectName: string;
}

export function StatusBar({ status, projectName }: StatusBarProps) {
  const getStatusDisplay = () => {
    switch (status.state) {
      case "idle":
        return { text: "Idle", color: "bg-zinc-500" };
      case "booting":
        return { text: "Booting...", color: "bg-yellow-500 animate-pulse" };
      case "installing":
        return {
          text: "Installing dependencies...",
          color: "bg-yellow-500 animate-pulse",
        };
      case "starting":
        return {
          text: "Starting dev server...",
          color: "bg-yellow-500 animate-pulse",
        };
      case "syncing":
        return { text: "Syncing...", color: "bg-blue-500 animate-pulse" };
      case "compiling":
        return { text: "Compiling...", color: "bg-blue-500 animate-pulse" };
      case "ready":
        return { text: "Ready", color: "bg-green-500" };
      case "error":
        return { text: "Error", color: "bg-red-500" };
      default:
        return { text: "Unknown", color: "bg-zinc-500" };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="h-12 bg-zinc-800 border-b border-zinc-700 flex items-center px-4 gap-4">
      {/* Back link */}
      <Link
        href="/builder"
        className="text-zinc-400 hover:text-white transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
      </Link>

      {/* Project name */}
      <span className="font-medium">{projectName}</span>

      {/* Divider */}
      <div className="h-4 w-px bg-zinc-700" />

      {/* Status indicator */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${statusDisplay.color}`} />
        <span className="text-sm text-zinc-400">{statusDisplay.text}</span>
      </div>

      {/* Error message */}
      {status.state === "error" && (
        <span className="text-sm text-red-400 truncate flex-1">
          {status.message}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />
    </div>
  );
}
