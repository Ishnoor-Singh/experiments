// === Agent Communication ===

export type AgentResult = {
  chatMessage: string;
  fileOps: FileOp[];
  schemaOps: SchemaOp[];
  status: "success" | "error";
  error?: {
    message: string;
    suggestion?: string;
    retryable: boolean;
  };
};

export type FileOp =
  | { op: "create"; path: string; content: string }
  | { op: "update"; path: string; content: string }
  | { op: "delete"; path: string };

export type SchemaOp =
  | { op: "createTable"; table: string; fields: FieldDef[] }
  | { op: "addField"; table: string; field: FieldDef }
  | { op: "updateField"; table: string; fieldName: string; field: FieldDef };

export type FieldDef = {
  name: string;
  type: "string" | "number" | "boolean" | "richtext" | "image" | "relation";
  required: boolean;
  relationTo?: string;
};

// === UI State ===

export type SystemStatus =
  | { state: "idle" }
  | { state: "booting" }
  | { state: "installing" }
  | { state: "starting" }
  | { state: "syncing" }
  | { state: "compiling" }
  | { state: "ready" }
  | { state: "error"; message: string };

// === WebContainer ===

export type FileDiff =
  | { op: "write"; path: string; content: string }
  | { op: "delete"; path: string };

export type PreviewEvent =
  | { type: "ready"; url: string }
  | { type: "error"; error: string }
  | { type: "reload" };

// === Project ===

export type Project = {
  _id: string;
  uuid: string;
  userId: string;
  name: string;
  createdAt: number;
};

export type ProjectFile = {
  _id: string;
  projectUuid: string;
  path: string;
  content: string;
  updatedAt: number;
};

export type AppSchema = {
  _id: string;
  key: string;
  projectUuid: string;
  tableName: string;
  fields: FieldDef[];
};

export type Message = {
  _id: string;
  projectUuid: string;
  role: "user" | "assistant";
  content: string;
  status: "success" | "error" | "pending";
  error?: string;
  timestamp: number;
};
