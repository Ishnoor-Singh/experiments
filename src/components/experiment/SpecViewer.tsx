"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  Database,
  Globe,
  Workflow,
  Layout,
  Server,
  Users,
  ChevronRight,
  Package,
} from "lucide-react";
import { useState } from "react";

interface SpecViewerProps {
  experimentId: string | null;
}

// Layer metadata
const layerInfo: Record<string, { icon: React.ElementType; label: string; description: string }> = {
  requirements: {
    icon: Users,
    label: "Requirements",
    description: "User personas, stories, and requirements",
  },
  data: {
    icon: Database,
    label: "Data",
    description: "Entities, relationships, and computed fields",
  },
  api: {
    icon: Globe,
    label: "API",
    description: "Endpoints and API specifications",
  },
  workflow: {
    icon: Workflow,
    label: "Workflows",
    description: "Business logic and processes",
  },
  ux: {
    icon: Layout,
    label: "UX",
    description: "Screens, components, and design tokens",
  },
  infra: {
    icon: Server,
    label: "Infrastructure",
    description: "Auth, roles, and deployment",
  },
};

// Block type display names
const blockTypeLabels: Record<string, string> = {
  // Requirements
  persona: "Persona",
  requirement: "Requirement",
  user_story: "User Story",
  // Data
  entity: "Entity",
  relationship: "Relationship",
  computed_field: "Computed Field",
  index: "Index",
  // API
  endpoint: "Endpoint",
  // Workflow
  workflow: "Workflow",
  // UX
  screen: "Screen",
  component: "Component",
  design_tokens: "Design Tokens",
  user_flow: "User Flow",
  // Infra
  auth: "Auth Config",
  role: "Role",
  deployment: "Deployment",
};

export function SpecViewer({ experimentId }: SpecViewerProps) {
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState("requirements");

  const groupedBlocks = useQuery(
    api.blocks.getGroupedByLayer,
    experimentId ? { experimentId: experimentId as Id<"experiments"> } : "skip"
  );

  const blockCounts = useQuery(
    api.blocks.getCountsByLayer,
    experimentId ? { experimentId: experimentId as Id<"experiments"> } : "skip"
  );

  if (!experimentId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <Package className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm">Select an experiment to view specifications</p>
      </div>
    );
  }

  const totalBlocks = blockCounts
    ? Object.values(blockCounts).reduce((sum, count) => sum + count, 0)
    : 0;

  if (totalBlocks === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4">
        <Package className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-sm font-medium">No specifications yet</p>
        <p className="text-xs mt-2 text-center">
          Specs will appear as agents create entities, endpoints, screens, and more.
        </p>
      </div>
    );
  }

  const layers = Object.keys(layerInfo);

  return (
    <div className="flex flex-col h-full">
      {/* Summary Header */}
      <div className="p-4 border-b">
        <h2 className="font-semibold">Specifications</h2>
        <p className="text-xs text-muted-foreground">
          {totalBlocks} blocks across {Object.values(blockCounts || {}).filter(c => c > 0).length} layers
        </p>
      </div>

      {/* Layer Tabs */}
      <Tabs value={activeLayer} onValueChange={setActiveLayer} className="flex-1 flex flex-col">
        <div className="px-2 pt-2 border-b">
          <TabsList className="h-auto flex flex-wrap gap-1 bg-transparent p-0">
            {layers.map((layer) => {
              const info = layerInfo[layer];
              const count = blockCounts?.[layer] || 0;
              const Icon = info.icon;

              return (
                <TabsTrigger
                  key={layer}
                  value={layer}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 text-xs rounded-md",
                    "data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  )}
                  disabled={count === 0}
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden sm:inline">{info.label}</span>
                  {count > 0 && (
                    <span className="ml-1 text-[10px] opacity-70">{count}</span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Layer Content */}
        {layers.map((layer) => (
          <TabsContent key={layer} value={layer} className="flex-1 mt-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-3 space-y-2">
                {groupedBlocks?.[layer]?.map((block: any) => (
                  <BlockCard
                    key={block._id}
                    block={block}
                    isSelected={selectedBlock === block._id}
                    onSelect={() => setSelectedBlock(
                      selectedBlock === block._id ? null : block._id
                    )}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

interface BlockCardProps {
  block: any;
  isSelected: boolean;
  onSelect: () => void;
}

function BlockCard({ block, isSelected, onSelect }: BlockCardProps) {
  const blockLabel = blockTypeLabels[block.blockType] || block.blockType;
  const blockName = block.data?.name || block.data?.title || blockLabel;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors",
        isSelected ? "ring-2 ring-primary" : "hover:bg-muted/50"
      )}
      onClick={onSelect}
    >
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
              {blockLabel}
            </span>
            <CardTitle className="text-sm">{blockName}</CardTitle>
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              isSelected && "rotate-90"
            )}
          />
        </div>
        {block.data?.description && (
          <CardDescription className="text-xs mt-1">
            {block.data.description}
          </CardDescription>
        )}
      </CardHeader>

      {isSelected && (
        <CardContent className="px-3 pb-3 pt-0">
          <BlockDetails block={block} />
        </CardContent>
      )}
    </Card>
  );
}

function BlockDetails({ block }: { block: any }) {
  const { blockType, data, createdBy } = block;

  // Render different details based on block type
  switch (blockType) {
    case "entity":
      return (
        <div className="space-y-2 text-xs">
          {data.tableName && (
            <div>
              <span className="text-muted-foreground">Table:</span>{" "}
              <code className="bg-muted px-1 rounded">{data.tableName}</code>
            </div>
          )}
          {data.fields && data.fields.length > 0 && (
            <div>
              <span className="text-muted-foreground">Fields:</span>
              <ul className="mt-1 space-y-0.5 ml-2">
                {data.fields.map((field: any, i: number) => (
                  <li key={i} className="font-mono">
                    <span className="text-blue-600">{field.name}</span>
                    <span className="text-muted-foreground">: {field.type}</span>
                    {field.required && <span className="text-red-500">*</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {createdBy && (
            <div className="text-muted-foreground pt-1 border-t">
              Created by {createdBy}
            </div>
          )}
        </div>
      );

    case "endpoint":
      return (
        <div className="space-y-2 text-xs">
          {data.method && data.path && (
            <div className="font-mono">
              <span
                className={cn(
                  "px-1 rounded text-white",
                  data.method === "GET" && "bg-green-600",
                  data.method === "POST" && "bg-blue-600",
                  data.method === "PUT" && "bg-yellow-600",
                  data.method === "PATCH" && "bg-orange-600",
                  data.method === "DELETE" && "bg-red-600"
                )}
              >
                {data.method}
              </span>{" "}
              <span>{data.path}</span>
            </div>
          )}
          {data.auth && (
            <div>
              <span className="text-muted-foreground">Auth:</span> {data.auth}
            </div>
          )}
          {createdBy && (
            <div className="text-muted-foreground pt-1 border-t">
              Created by {createdBy}
            </div>
          )}
        </div>
      );

    case "screen":
      return (
        <div className="space-y-2 text-xs">
          {data.route && (
            <div className="font-mono">
              <span className="text-muted-foreground">Route:</span> {data.route}
            </div>
          )}
          {data.purpose && (
            <div>
              <span className="text-muted-foreground">Purpose:</span> {data.purpose}
            </div>
          )}
          {data.regions && data.regions.length > 0 && (
            <div>
              <span className="text-muted-foreground">Regions:</span>{" "}
              {data.regions.map((r: any) => r.name).join(", ")}
            </div>
          )}
          {createdBy && (
            <div className="text-muted-foreground pt-1 border-t">
              Created by {createdBy}
            </div>
          )}
        </div>
      );

    case "persona":
      return (
        <div className="space-y-2 text-xs">
          {data.goals && data.goals.length > 0 && (
            <div>
              <span className="text-muted-foreground">Goals:</span>
              <ul className="mt-1 ml-2 list-disc list-inside">
                {data.goals.slice(0, 3).map((goal: string, i: number) => (
                  <li key={i}>{goal}</li>
                ))}
              </ul>
            </div>
          )}
          {data.painPoints && data.painPoints.length > 0 && (
            <div>
              <span className="text-muted-foreground">Pain Points:</span>
              <ul className="mt-1 ml-2 list-disc list-inside">
                {data.painPoints.slice(0, 3).map((point: string, i: number) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </div>
          )}
          {createdBy && (
            <div className="text-muted-foreground pt-1 border-t">
              Created by {createdBy}
            </div>
          )}
        </div>
      );

    case "user_story":
      return (
        <div className="space-y-2 text-xs">
          <div className="italic">
            As a <strong>{data.persona}</strong>, I want{" "}
            <strong>{data.goal}</strong> so that <strong>{data.benefit}</strong>
          </div>
          {data.priority && (
            <div>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-white text-[10px]",
                  data.priority === "must-have" && "bg-red-600",
                  data.priority === "should-have" && "bg-yellow-600",
                  data.priority === "nice-to-have" && "bg-green-600"
                )}
              >
                {data.priority}
              </span>
            </div>
          )}
          {createdBy && (
            <div className="text-muted-foreground pt-1 border-t">
              Created by {createdBy}
            </div>
          )}
        </div>
      );

    case "requirement":
      return (
        <div className="space-y-2 text-xs">
          {data.priority && (
            <div>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-white text-[10px]",
                  data.priority === "must-have" && "bg-red-600",
                  data.priority === "should-have" && "bg-yellow-600",
                  data.priority === "nice-to-have" && "bg-green-600"
                )}
              >
                {data.priority}
              </span>
            </div>
          )}
          {data.acceptance && data.acceptance.length > 0 && (
            <div>
              <span className="text-muted-foreground">Acceptance Criteria:</span>
              <ul className="mt-1 ml-2 list-disc list-inside">
                {data.acceptance.slice(0, 3).map((criteria: string, i: number) => (
                  <li key={i}>{criteria}</li>
                ))}
              </ul>
            </div>
          )}
          {createdBy && (
            <div className="text-muted-foreground pt-1 border-t">
              Created by {createdBy}
            </div>
          )}
        </div>
      );

    case "component":
      return (
        <div className="space-y-2 text-xs">
          {data.props && data.props.length > 0 && (
            <div>
              <span className="text-muted-foreground">Props:</span>
              <ul className="mt-1 space-y-0.5 ml-2 font-mono">
                {data.props.slice(0, 5).map((prop: any, i: number) => (
                  <li key={i}>
                    <span className="text-blue-600">{prop.name}</span>
                    <span className="text-muted-foreground">: {prop.type}</span>
                    {prop.required && <span className="text-red-500">*</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.layout?.pattern && (
            <div>
              <span className="text-muted-foreground">Layout:</span> {data.layout.pattern}
            </div>
          )}
          {createdBy && (
            <div className="text-muted-foreground pt-1 border-t">
              Created by {createdBy}
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="text-xs">
          <pre className="bg-muted p-2 rounded overflow-x-auto max-h-32">
            {JSON.stringify(data, null, 2)}
          </pre>
          {createdBy && (
            <div className="text-muted-foreground pt-1 mt-2 border-t">
              Created by {createdBy}
            </div>
          )}
        </div>
      );
  }
}
