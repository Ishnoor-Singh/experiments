import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByProject = query({
  args: {
    projectUuid: v.string(),
  },
  handler: async (ctx, args) => {
    const schemas = await ctx.db
      .query("appSchemas")
      .withIndex("by_project", (q) => q.eq("projectUuid", args.projectUuid))
      .collect();
    return schemas;
  },
});

export const getByKey = query({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const schema = await ctx.db
      .query("appSchemas")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    return schema;
  },
});

export const upsert = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("appSchemas")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        tableName: args.tableName,
        fields: args.fields,
      });
      return existing._id;
    } else {
      const schemaId = await ctx.db.insert("appSchemas", {
        key: args.key,
        projectUuid: args.projectUuid,
        tableName: args.tableName,
        fields: args.fields,
      });
      return schemaId;
    }
  },
});

export const remove = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const schema = await ctx.db
      .query("appSchemas")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (schema) {
      await ctx.db.delete(schema._id);
    }
  },
});
