"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  FileCode,
  FileJson,
  FileText,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Download,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";

interface FileViewerProps {
  experimentId: string | null;
}

// File type icons based on extension
const getFileIcon = (path: string) => {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
      return FileCode;
    case "json":
      return FileJson;
    case "css":
    case "md":
    default:
      return FileText;
  }
};

// Get language from extension
const getLanguage = (path: string): string => {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts":
    case "tsx":
      return "typescript";
    case "js":
    case "jsx":
      return "javascript";
    case "json":
      return "json";
    case "css":
      return "css";
    case "md":
      return "markdown";
    default:
      return "text";
  }
};

// Build tree structure from flat file list
interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children: TreeNode[];
  file?: any;
}

function buildFileTree(files: any[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const currentPath = parts.slice(0, i + 1).join("/");

      let existing = current.find(n => n.name === part);

      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          isDirectory: !isLast,
          children: [],
          file: isLast ? file : undefined,
        };
        current.push(existing);
      }

      if (!isLast) {
        current = existing.children;
      }
    }
  }

  // Sort: directories first, then alphabetically
  const sortNodes = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(n => sortNodes(n.children));
  };

  sortNodes(root);
  return root;
}

export function FileViewer({ experimentId }: FileViewerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(["convex", "src"]));
  const [copied, setCopied] = useState(false);

  const files = useQuery(
    api.generated_files.list,
    experimentId ? { experimentId: experimentId as Id<"experiments"> } : "skip"
  );

  const stats = useQuery(
    api.generated_files.getStats,
    experimentId ? { experimentId: experimentId as Id<"experiments"> } : "skip"
  );

  const fileTree = useMemo(() => {
    if (!files) return [];
    return buildFileTree(files);
  }, [files]);

  const selectedFileData = useMemo(() => {
    if (!files || !selectedFile) return null;
    return files.find(f => f.path === selectedFile);
  }, [files, selectedFile]);

  const toggleDir = (path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const copyToClipboard = async () => {
    if (selectedFileData?.content) {
      await navigator.clipboard.writeText(selectedFileData.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadFile = () => {
    if (selectedFileData) {
      const blob = new Blob([selectedFileData.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = selectedFileData.path.split("/").pop() || "file.txt";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!experimentId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <FileCode className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">Select an experiment to view generated files</p>
      </div>
    );
  }

  if (!files || files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <FileCode className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm font-medium">No files generated yet</p>
        <p className="text-xs mt-2 text-center">
          Files will appear as code generation agents create them.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Summary Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold">Generated Files</h2>
        <p className="text-xs text-muted-foreground">
          {stats?.totalFiles || 0} files, {stats?.totalLines || 0} lines
        </p>
      </div>

      {/* Split view: tree and content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* File Tree */}
        <div className={cn("border-b", selectedFile ? "h-1/3" : "flex-1")}>
          <ScrollArea className="h-full">
            <div className="p-2">
              {fileTree.map(node => (
                <TreeNodeComponent
                  key={node.path}
                  node={node}
                  depth={0}
                  expandedDirs={expandedDirs}
                  toggleDir={toggleDir}
                  selectedFile={selectedFile}
                  onSelectFile={setSelectedFile}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* File Content */}
        {selectedFile && selectedFileData && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-2 border-b flex items-center justify-between bg-muted/50">
              <div className="flex items-center gap-2 min-w-0">
                {(() => {
                  const Icon = getFileIcon(selectedFile);
                  return <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
                })()}
                <span className="text-xs font-mono truncate">{selectedFile}</span>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={copyToClipboard}
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={downloadFile}
                  title="Download file"
                >
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <pre className="p-3 text-xs font-mono whitespace-pre-wrap break-words">
                <code>{selectedFileData.content}</code>
              </pre>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}

interface TreeNodeComponentProps {
  node: TreeNode;
  depth: number;
  expandedDirs: Set<string>;
  toggleDir: (path: string) => void;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
}

function TreeNodeComponent({
  node,
  depth,
  expandedDirs,
  toggleDir,
  selectedFile,
  onSelectFile,
}: TreeNodeComponentProps) {
  const isExpanded = expandedDirs.has(node.path);
  const isSelected = selectedFile === node.path;

  if (node.isDirectory) {
    return (
      <div>
        <div
          className={cn(
            "flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer hover:bg-muted/50 text-xs",
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => toggleDir(node.path)}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <FolderOpen className={cn("h-3 w-3", isExpanded ? "text-yellow-500" : "text-muted-foreground")} />
          <span className="truncate">{node.name}</span>
        </div>
        {isExpanded && (
          <div>
            {node.children.map(child => (
              <TreeNodeComponent
                key={child.path}
                node={child}
                depth={depth + 1}
                expandedDirs={expandedDirs}
                toggleDir={toggleDir}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const Icon = getFileIcon(node.path);

  return (
    <div
      className={cn(
        "flex items-center gap-1 py-1 px-2 rounded-md cursor-pointer text-xs",
        isSelected ? "bg-primary text-primary-foreground" : "hover:bg-muted/50"
      )}
      style={{ paddingLeft: `${depth * 12 + 8}px` }}
      onClick={() => onSelectFile(node.path)}
    >
      <Icon className={cn("h-3 w-3", isSelected ? "text-primary-foreground" : "text-blue-500")} />
      <span className="truncate">{node.name}</span>
    </div>
  );
}
