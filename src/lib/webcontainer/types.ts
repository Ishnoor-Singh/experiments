import type { WebContainer } from "@webcontainer/api";

export type { WebContainer };

export interface WebContainerFile {
  path: string;
  content: string;
}

export interface WebContainerState {
  instance: WebContainer | null;
  isBooting: boolean;
  isReady: boolean;
  error: string | null;
  previewUrl: string | null;
}

export interface FileDiff {
  op: "write" | "delete";
  path: string;
  content?: string;
}
