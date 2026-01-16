import type { FileDiff } from "./types";

interface ConvexFile {
  path: string;
  content: string;
  updatedAt: number;
}

interface FileState {
  content: string;
  updatedAt: number;
}

/**
 * Compute diffs between Convex files and local state
 */
export function computeDiffs(
  convexFiles: ConvexFile[],
  localState: Map<string, FileState>
): FileDiff[] {
  const diffs: FileDiff[] = [];
  const convexPaths = new Set<string>();

  // Check for new or updated files
  for (const file of convexFiles) {
    convexPaths.add(file.path);
    const local = localState.get(file.path);

    if (!local) {
      // New file
      diffs.push({ op: "write", path: file.path, content: file.content });
    } else if (file.updatedAt > local.updatedAt) {
      // Updated file
      diffs.push({ op: "write", path: file.path, content: file.content });
    }
  }

  // Check for deleted files
  for (const [path] of localState) {
    if (!convexPaths.has(path)) {
      diffs.push({ op: "delete", path });
    }
  }

  return diffs;
}

/**
 * Build local state from Convex files
 */
export function buildLocalState(files: ConvexFile[]): Map<string, FileState> {
  const state = new Map<string, FileState>();

  for (const file of files) {
    state.set(file.path, {
      content: file.content,
      updatedAt: file.updatedAt,
    });
  }

  return state;
}
