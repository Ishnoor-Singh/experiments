import { WebContainer } from "@webcontainer/api";
import type { WebContainerFile, FileDiff } from "./types";

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

/**
 * Check if running on a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;

  // Check for mobile user agent
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

  // Also check screen width as a fallback
  const isSmallScreen = window.innerWidth < 768;

  return isMobile || isSmallScreen;
}

/**
 * Check if the browser supports cross-origin isolation required for WebContainers
 */
export function checkCrossOriginIsolation(): { supported: boolean; reason?: string } {
  if (typeof window === "undefined") {
    return { supported: false, reason: "Not in browser environment" };
  }

  if (!("crossOriginIsolated" in window)) {
    return { supported: false, reason: "Browser does not support crossOriginIsolated" };
  }

  if (!window.crossOriginIsolated) {
    return {
      supported: false,
      reason: "Page is not cross-origin isolated. Ensure COOP and COEP headers are set.",
    };
  }

  return { supported: true };
}

/**
 * Boot or get the singleton WebContainer instance
 */
export async function bootWebContainer(): Promise<WebContainer> {
  // Check cross-origin isolation first
  const isolation = checkCrossOriginIsolation();
  if (!isolation.supported) {
    throw new Error(`WebContainer cannot start: ${isolation.reason}`);
  }

  if (webcontainerInstance) {
    return webcontainerInstance;
  }

  if (bootPromise) {
    return bootPromise;
  }

  bootPromise = WebContainer.boot().then((instance) => {
    webcontainerInstance = instance;
    return instance;
  });

  return bootPromise;
}

/**
 * Get the current WebContainer instance (if booted)
 */
export function getWebContainer(): WebContainer | null {
  return webcontainerInstance;
}

/**
 * Mount files to the WebContainer filesystem
 * Optimized to create directories first, then mount files in parallel batches
 */
export async function mountFiles(
  wc: WebContainer,
  files: WebContainerFile[]
): Promise<void> {
  // First, collect all unique directories
  const directories = new Set<string>();
  for (const file of files) {
    const pathParts = file.path.split("/").filter(Boolean);
    pathParts.pop(); // Remove filename
    if (pathParts.length > 0) {
      // Add all parent directories
      let current = "";
      for (const part of pathParts) {
        current = current ? `${current}/${part}` : part;
        directories.add(current);
      }
    }
  }

  // Create all directories (sorted by depth to avoid race conditions)
  const sortedDirs = Array.from(directories).sort((a, b) =>
    a.split("/").length - b.split("/").length
  );
  for (const dir of sortedDirs) {
    await wc.fs.mkdir(dir, { recursive: true });
  }

  // Mount files in parallel batches for faster loading
  const BATCH_SIZE = 5; // Balance between parallelism and memory
  const fileBatches: WebContainerFile[][] = [];
  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    fileBatches.push(files.slice(i, i + BATCH_SIZE));
  }

  for (const batch of fileBatches) {
    await Promise.all(
      batch.map(async (file) => {
        const fullPath = file.path.startsWith("/") ? file.path.slice(1) : file.path;
        await wc.fs.writeFile(fullPath, file.content);
      })
    );
  }
}

/**
 * Apply file diffs to the WebContainer filesystem
 */
export async function applyDiffs(
  wc: WebContainer,
  diffs: FileDiff[]
): Promise<void> {
  for (const diff of diffs) {
    const fullPath = diff.path.startsWith("/") ? diff.path.slice(1) : diff.path;

    if (diff.op === "write" && diff.content !== undefined) {
      const pathParts = fullPath.split("/");
      const dirPath = pathParts.slice(0, -1).join("/");

      if (dirPath) {
        await wc.fs.mkdir(dirPath, { recursive: true });
      }

      await wc.fs.writeFile(fullPath, diff.content);
    } else if (diff.op === "delete") {
      try {
        await wc.fs.rm(fullPath);
      } catch {
        // File might not exist, ignore
      }
    }
  }
}

/**
 * Run npm install in the WebContainer with optimizations
 * Uses npm ci when package-lock.json exists, and --prefer-offline to use cached packages
 */
export async function installDependencies(
  wc: WebContainer,
  onOutput?: (data: string) => void
): Promise<number> {
  // Check if package-lock.json exists for faster ci install
  let hasLockFile = false;
  try {
    await wc.fs.readFile("package-lock.json", "utf-8");
    hasLockFile = true;
  } catch {
    hasLockFile = false;
  }

  // Use npm ci for faster installs when lock file exists
  // Add --prefer-offline to use cached packages when available
  const command = hasLockFile ? "ci" : "install";
  const args = [command, "--prefer-offline", "--no-audit", "--no-fund"];

  // On mobile, add --omit=dev to skip dev dependencies if possible
  // This significantly reduces install time but may break some setups
  // For now, we keep dev deps since Next.js needs them

  const installProcess = await wc.spawn("npm", args);

  if (onOutput) {
    installProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          onOutput(data);
        },
      })
    );
  }

  return installProcess.exit;
}

/**
 * Start the Next.js dev server
 */
export async function startDevServer(
  wc: WebContainer,
  onOutput?: (data: string) => void,
  onServerReady?: (port: number, url: string) => void
): Promise<void> {
  // Set up server ready listener before spawning
  wc.on("server-ready", (port, url) => {
    if (onServerReady) {
      onServerReady(port, url);
    }
  });

  const devProcess = await wc.spawn("npm", ["run", "dev"]);

  if (onOutput) {
    devProcess.output.pipeTo(
      new WritableStream({
        write(data) {
          onOutput(data);
        },
      })
    );
  }
}

/**
 * Read a file from the WebContainer
 */
export async function readFile(
  wc: WebContainer,
  path: string
): Promise<string | null> {
  try {
    const fullPath = path.startsWith("/") ? path.slice(1) : path;
    const content = await wc.fs.readFile(fullPath, "utf-8");
    return content;
  } catch {
    return null;
  }
}
