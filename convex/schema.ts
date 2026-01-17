import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  projects: defineTable({
    // New fields for builder
    uuid: v.optional(v.string()),
    userId: v.optional(v.string()),
    name: v.string(),
    createdAt: v.number(),
    // Legacy fields
    description: v.optional(v.string()),
    sessionId: v.optional(v.string()),
    status: v.optional(v.string()),
    updatedAt: v.optional(v.number()),
    appSchema: v.optional(v.string()),
    templateId: v.optional(v.string()),
  })
    .index("by_uuid", ["uuid"])
    .index("by_user", ["userId"]),

  projectFiles: defineTable({
    projectUuid: v.string(),
    path: v.string(),
    content: v.string(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectUuid"])
    .index("by_project_path", ["projectUuid", "path"]),

  messages: defineTable({
    projectUuid: v.optional(v.string()),
    experimentId: v.optional(v.string()), // Legacy field
    agentName: v.optional(v.string()), // Legacy field
    agentRole: v.optional(v.string()), // Legacy field
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    status: v.optional(
      v.union(
        v.literal("success"),
        v.literal("error"),
        v.literal("pending"),
        v.literal("streaming")
      )
    ),
    error: v.optional(v.string()),
    timestamp: v.optional(v.number()),
  }).index("by_project", ["projectUuid"]),

  appSchemas: defineTable({
    key: v.string(),
    projectUuid: v.string(),
    tableName: v.string(),
    fields: v.array(
      v.object({
        name: v.string(),
        type: v.string(),
        required: v.boolean(),
        relationTo: v.optional(v.string()),
      })
    ),
  })
    .index("by_key", ["key"])
    .index("by_project", ["projectUuid"]),

  appRecords: defineTable({
    schemaKey: v.string(),
    data: v.any(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_schema", ["schemaKey"]),
});
