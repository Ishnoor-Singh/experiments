"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { SystemStatus } from "@/lib/types";
import type { WebContainer } from "@webcontainer/api";
import {
  bootWebContainer,
  mountFiles,
  applyDiffs,
  installDependencies,
  startDevServer,
} from "@/lib/webcontainer/service";
import { computeDiffs, buildLocalState } from "@/lib/webcontainer/sync";

interface ConvexFile {
  path: string;
  content: string;
  updatedAt: number;
}

interface UseWebContainerResult {
  status: SystemStatus;
  previewUrl: string | null;
  error: string | null;
}

export function useWebContainer(
  projectUuid: string,
  files: ConvexFile[] | undefined
): UseWebContainerResult {
  const [status, setStatus] = useState<SystemStatus>({ state: "idle" });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wcRef = useRef<WebContainer | null>(null);
  const localStateRef = useRef<Map<string, { content: string; updatedAt: number }>>(new Map());
  const isBootingRef = useRef(false);
  const isReadyRef = useRef(false);
  const hasMountedRef = useRef(false);
  const lastSyncRef = useRef<number>(0);
  const isCompilingRef = useRef(false);

  // Handle dev server output to detect compilation state
  const handleDevServerOutput = useCallback((output: string) => {
    console.log("[dev server]", output);

    // Next.js compilation patterns
    if (output.includes("Compiling") || output.includes("compiling")) {
      if (!isCompilingRef.current) {
        isCompilingRef.current = true;
        setStatus({ state: "compiling" });
      }
    } else if (
      output.includes("Compiled") ||
      output.includes("compiled") ||
      output.includes("Ready in") ||
      output.includes("ready in")
    ) {
      if (isCompilingRef.current) {
        isCompilingRef.current = false;
        setStatus({ state: "ready" });
      }
    }
  }, []);

  const seedProject = useMutation(api.seed.seedProject);

  // Seed project if no files exist
  useEffect(() => {
    if (files !== undefined && files.length === 0) {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "";
      seedProject({ projectUuid, convexUrl }).catch((err) => {
        console.error("Failed to seed project:", err);
      });
    }
  }, [files, projectUuid, seedProject]);

  // Boot WebContainer and mount initial files
  const boot = useCallback(async () => {
    if (isBootingRef.current || hasMountedRef.current) return;
    if (!files || files.length === 0) return;

    isBootingRef.current = true;
    setStatus({ state: "booting" });
    setError(null);

    try {
      // Boot WebContainer (singleton)
      const wc = await bootWebContainer();
      wcRef.current = wc;

      // Mount files
      setStatus({ state: "installing" });
      const filesToMount = files.map((f) => ({
        path: f.path,
        content: f.content,
      }));
      await mountFiles(wc, filesToMount);
      hasMountedRef.current = true;

      // Build local state
      localStateRef.current = buildLocalState(files);

      // Install dependencies
      const exitCode = await installDependencies(wc, (output) => {
        console.log("[npm install]", output);
      });

      if (exitCode !== 0) {
        throw new Error(`npm install failed with exit code ${exitCode}`);
      }

      // Start dev server
      setStatus({ state: "starting" });
      await startDevServer(
        wc,
        handleDevServerOutput,
        (port, url) => {
          console.log(`[server-ready] Port ${port}, URL: ${url}`);
          setPreviewUrl(url);
          setStatus({ state: "ready" });
          isReadyRef.current = true;
        }
      );
    } catch (err) {
      console.error("WebContainer boot error:", err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setStatus({ state: "error", message });
      setError(message);
    } finally {
      isBootingRef.current = false;
    }
  }, [files, handleDevServerOutput]);

  // Sync files when they change
  const syncFiles = useCallback(async () => {
    if (!wcRef.current || !isReadyRef.current || !files) return;
    if (files.length === 0) return;

    // Debounce sync
    const now = Date.now();
    if (now - lastSyncRef.current < 500) return;
    lastSyncRef.current = now;

    // Compute diffs
    const diffs = computeDiffs(files, localStateRef.current);

    if (diffs.length === 0) return;

    console.log("[sync] Applying diffs:", diffs.length);
    setStatus({ state: "syncing" });

    try {
      await applyDiffs(wcRef.current, diffs);

      // Update local state
      localStateRef.current = buildLocalState(files);

      setStatus({ state: "ready" });
    } catch (err) {
      console.error("Sync error:", err);
      const message = err instanceof Error ? err.message : "Sync failed";
      setStatus({ state: "error", message });
      setError(message);
    }
  }, [files]);

  // Initial boot
  useEffect(() => {
    if (files !== undefined && !wcRef.current && !isBootingRef.current) {
      boot();
    }
  }, [files, boot]);

  // Sync on file changes
  useEffect(() => {
    if (isReadyRef.current && files) {
      syncFiles();
    }
  }, [files, syncFiles]);

  return { status, previewUrl, error };
}
