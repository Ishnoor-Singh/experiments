import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listByProject = query({
  args: {
    projectUuid: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_project", (q) => q.eq("projectUuid", args.projectUuid))
      .collect();
    return messages;
  },
});

export const create = mutation({
  args: {
    projectUuid: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    status: v.union(
      v.literal("success"),
      v.literal("error"),
      v.literal("pending")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      projectUuid: args.projectUuid,
      role: args.role,
      content: args.content,
      status: args.status,
      error: args.error,
      timestamp: Date.now(),
    });
    return messageId;
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("messages"),
    status: v.union(
      v.literal("success"),
      v.literal("error"),
      v.literal("pending")
    ),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: args.status,
      error: args.error,
    });
  },
});
