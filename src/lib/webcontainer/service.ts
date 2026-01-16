import { WebContainer } from "@webcontainer/api";
import type { WebContainerFile, FileDiff } from "./types";

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

/**
 * Boot or get the singleton WebContainer instance
 */
export async function bootWebContainer(): Promise<WebContainer> {
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
 */
export async function mountFiles(
  wc: WebContainer,
  files: WebContainerFile[]
): Promise<void> {
  for (const file of files) {
    const pathParts = file.path.split("/").filter(Boolean);
    const fileName = pathParts.pop();
    const dirPath = pathParts.join("/");

    // Create directory structure
    if (dirPath) {
      await wc.fs.mkdir(dirPath, { recursive: true });
    }

    // Write file
    const fullPath = file.path.startsWith("/") ? file.path.slice(1) : file.path;
    await wc.fs.writeFile(fullPath, file.content);
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
 * Run npm install in the WebContainer
 */
export async function installDependencies(
  wc: WebContainer,
  onOutput?: (data: string) => void
): Promise<number> {
  const installProcess = await wc.spawn("npm", ["install"]);

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
