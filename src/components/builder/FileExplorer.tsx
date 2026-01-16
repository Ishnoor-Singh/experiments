"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState, useMemo } from "react";

interface FileExplorerProps {
  projectUuid: string;
}

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
  content?: string;
}

function buildFileTree(
  files: { path: string; content: string }[]
): FileNode[] {
  const root: FileNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);
    let currentLevel = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      const existingNode = currentLevel.find((n) => n.name === part);

      if (existingNode) {
        if (!isFile && existingNode.children) {
          currentLevel = existingNode.children;
        }
      } else {
        const newNode: FileNode = {
          name: part,
          path: "/" + parts.slice(0, i + 1).join("/"),
          isDirectory: !isFile,
          ...(isFile ? { content: file.content } : { children: [] }),
        };
        currentLevel.push(newNode);
        if (!isFile && newNode.children) {
          currentLevel = newNode.children;
        }
      }
    }
  }

  // Sort: directories first, then alphabetically
  const sortNodes = (nodes: FileNode[]): FileNode[] => {
    return nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    }).map((node) => {
      if (node.children) {
        return { ...node, children: sortNodes(node.children) };
      }
      return node;
    });
  };

  return sortNodes(root);
}

function FileTreeNode({
  node,
  level,
  selectedPath,
  onSelect,
  expandedPaths,
  onToggle,
}: {
  node: FileNode;
  level: number;
  selectedPath: string | null;
  onSelect: (path: string, content?: string) => void;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
}) {
  const isExpanded = expandedPaths.has(node.path);
  const isSelected = selectedPath === node.path;

  return (
    <div>
      <button
        onClick={() => {
          if (node.isDirectory) {
            onToggle(node.path);
          } else {
            onSelect(node.path, node.content);
          }
        }}
        className={`w-full flex items-center gap-1 px-2 py-1 text-sm text-left hover:bg-zinc-800 transition-colors ${
          isSelected ? "bg-zinc-700" : ""
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {node.isDirectory ? (
          <>
            <svg
              className={`w-4 h-4 text-zinc-500 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            <svg
              className="w-4 h-4 text-yellow-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
            </svg>
          </>
        ) : (
          <>
            <span className="w-4" />
            <svg
              className="w-4 h-4 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {node.isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              level={level + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              expandedPaths={expandedPaths}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer({ projectUuid }: FileExplorerProps) {
  const files = useQuery(api.projectFiles.listByProject, { projectUuid });
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(
    new Set(["/app", "/components", "/lib"])
  );

  const fileTree = useMemo(() => {
    if (!files) return [];
    return buildFileTree(files.map((f) => ({ path: f.path, content: f.content })));
  }, [files]);

  const handleSelect = (path: string, content?: string) => {
    setSelectedPath(path);
    setSelectedContent(content || null);
  };

  const handleToggle = (path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  if (files === undefined) {
    return (
      <div className="p-4 text-zinc-500 text-sm">Loading files...</div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="p-4 text-zinc-500 text-sm">No files yet</div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* File tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {fileTree.map((node) => (
          <FileTreeNode
            key={node.path}
            node={node}
            level={0}
            selectedPath={selectedPath}
            onSelect={handleSelect}
            expandedPaths={expandedPaths}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {/* File content preview */}
      {selectedContent && (
        <div className="border-t border-zinc-800 max-h-48 overflow-y-auto">
          <div className="p-2 text-xs bg-zinc-800 border-b border-zinc-700 sticky top-0">
            {selectedPath}
          </div>
          <pre className="p-2 text-xs text-zinc-400 overflow-x-auto">
            {selectedContent.slice(0, 1000)}
            {selectedContent.length > 1000 && "..."}
          </pre>
        </div>
      )}
    </div>
  );
}
