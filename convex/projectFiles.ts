import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByProject = query({
  args: {
    projectUuid: v.string(),
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("projectFiles")
      .withIndex("by_project", (q) => q.eq("projectUuid", args.projectUuid))
      .collect();
    return files;
  },
});

export const getByPath = query({
  args: {
    projectUuid: v.string(),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectUuid", args.projectUuid).eq("path", args.path)
      )
      .first();
    return file;
  },
});

export const upsert = mutation({
  args: {
    projectUuid: v.string(),
    path: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectUuid", args.projectUuid).eq("path", args.path)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        content: args.content,
        updatedAt: Date.now(),
      });
      return existing._id;
    } else {
      const fileId = await ctx.db.insert("projectFiles", {
        projectUuid: args.projectUuid,
        path: args.path,
        content: args.content,
        updatedAt: Date.now(),
      });
      return fileId;
    }
  },
});

export const remove = mutation({
  args: {
    projectUuid: v.string(),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("projectFiles")
      .withIndex("by_project_path", (q) =>
        q.eq("projectUuid", args.projectUuid).eq("path", args.path)
      )
      .first();

    if (file) {
      await ctx.db.delete(file._id);
    }
  },
});

export const bulkInsert = mutation({
  args: {
    projectUuid: v.string(),
    files: v.array(
      v.object({
        path: v.string(),
        content: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    for (const file of args.files) {
      await ctx.db.insert("projectFiles", {
        projectUuid: args.projectUuid,
        path: file.path,
        content: file.content,
        updatedAt: now,
      });
    }
  },
});
