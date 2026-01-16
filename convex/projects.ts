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

    if (project) {
      await ctx.db.delete(project._id);
    }
  },
});
