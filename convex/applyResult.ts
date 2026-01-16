import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Apply the agent result to the database
 * This is called by the agents.processMessage action after AI processing
 */
export const applyAgentResult = internalMutation({
  args: {
    projectUuid: v.string(),
    messageId: v.id("messages"),
    result: v.object({
      chatMessage: v.string(),
      fileOps: v.array(
        v.object({
          type: v.union(
            v.literal("create"),
            v.literal("update"),
            v.literal("delete")
          ),
          path: v.string(),
          content: v.optional(v.string()),
        })
      ),
      schemaOps: v.array(
        v.object({
          type: v.union(
            v.literal("createTable"),
            v.literal("addField"),
            v.literal("removeField"),
            v.literal("deleteTable")
          ),
          tableName: v.string(),
          fields: v.optional(
            v.array(
              v.object({
                name: v.string(),
                type: v.string(),
                required: v.boolean(),
                relationTo: v.optional(v.string()),
              })
            )
          ),
          field: v.optional(
            v.object({
              name: v.string(),
              type: v.string(),
              required: v.boolean(),
              relationTo: v.optional(v.string()),
            })
          ),
          fieldName: v.optional(v.string()),
        })
      ),
      status: v.union(v.literal("success"), v.literal("error")),
      error: v.optional(
        v.object({
          message: v.string(),
          suggestion: v.optional(v.string()),
          retryable: v.boolean(),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    const { projectUuid, messageId, result } = args;

    // Update the original user message status
    await ctx.db.patch(messageId, {
      status: result.status,
      error: result.error?.message,
    });

    // Apply file operations
    for (const op of result.fileOps) {
      switch (op.type) {
        case "create":
        case "update":
          if (op.content) {
            // Check if file exists
            const existing = await ctx.db
              .query("projectFiles")
              .withIndex("by_project_path", (q) =>
                q.eq("projectUuid", projectUuid).eq("path", op.path)
              )
              .first();

            if (existing) {
              await ctx.db.patch(existing._id, {
                content: op.content,
                updatedAt: Date.now(),
              });
            } else {
              await ctx.db.insert("projectFiles", {
                projectUuid,
                path: op.path,
                content: op.content,
                updatedAt: Date.now(),
              });
            }
          }
          break;
        case "delete":
          const toDelete = await ctx.db
            .query("projectFiles")
            .withIndex("by_project_path", (q) =>
              q.eq("projectUuid", projectUuid).eq("path", op.path)
            )
            .first();
          if (toDelete) {
            await ctx.db.delete(toDelete._id);
          }
          break;
      }
    }

    // Apply schema operations
    for (const op of result.schemaOps) {
      const schemaKey = `${projectUuid}_${op.tableName}`;

      switch (op.type) {
        case "createTable":
          if (op.fields) {
            await ctx.db.insert("appSchemas", {
              key: schemaKey,
              projectUuid,
              tableName: op.tableName,
              fields: op.fields,
            });
          }
          break;
        case "addField":
          if (op.field) {
            const schema = await ctx.db
              .query("appSchemas")
              .withIndex("by_key", (q) => q.eq("key", schemaKey))
              .first();
            if (schema) {
              await ctx.db.patch(schema._id, {
                fields: [...schema.fields, op.field],
              });
            }
          }
          break;
        case "removeField":
          if (op.fieldName) {
            const schema = await ctx.db
              .query("appSchemas")
              .withIndex("by_key", (q) => q.eq("key", schemaKey))
              .first();
            if (schema) {
              await ctx.db.patch(schema._id, {
                fields: schema.fields.filter((f) => f.name !== op.fieldName),
              });
            }
          }
          break;
        case "deleteTable":
          const toDeleteSchema = await ctx.db
            .query("appSchemas")
            .withIndex("by_key", (q) => q.eq("key", schemaKey))
            .first();
          if (toDeleteSchema) {
            await ctx.db.delete(toDeleteSchema._id);
          }
          break;
      }
    }

    // Create assistant response message
    await ctx.db.insert("messages", {
      projectUuid,
      role: "assistant",
      content: result.chatMessage,
      status: result.status,
      error: result.error?.message,
      timestamp: Date.now(),
    });
  },
});
