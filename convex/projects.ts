import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    uuid: v.string(),
    userId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const projectId = await ctx.db.insert("projects", {
      uuid: args.uuid,
      userId: args.userId,
      name: args.name,
      createdAt: Date.now(),
    });
    return projectId;
  },
});

export const list = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    return projects;
  },
});

export const getByUuid = query({
  args: {
    uuid: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_uuid", (q) => q.eq("uuid", args.uuid))
      .first();
    return project;
  },
});

export const remove = mutation({
  args: {
    uuid: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_uuid", (q) => q.eq("uuid", args.uuid))
      .first();

    if (!project) return;

    // Delete all project files
    const files = await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectUuid", args.uuid))
      .collect();
    for (const file of files) {
      await ctx.db.delete(file._id);
    }

    // Delete all app schemas
    const schemas = await ctx.db
      .query("appSchemas")
      .withIndex("by_project", (q) => q.eq("projectUuid", args.uuid))
      .collect();
    for (const schema of schemas) {
      // Delete all records for this schema
      const records = await ctx.db
        .query("appRecords")
        .withIndex("by_schema", (q) => q.eq("schemaKey", schema.key))
        .collect();
      for (const record of records) {
        await ctx.db.delete(record._id);
      }
      await ctx.db.delete(schema._id);
    }

    // Delete all messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_project", (q) => q.eq("projectUuid", args.uuid))
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Finally delete the project
    await ctx.db.delete(project._id);
  },
});

export const rename = mutation({
  args: {
    uuid: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db
      .query("projects")
      .withIndex("by_uuid", (q) => q.eq("uuid", args.uuid))
      .first();

    if (project) {
      await ctx.db.patch(project._id, { name: args.name });
    }
  },
});
