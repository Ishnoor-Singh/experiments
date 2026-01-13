import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();
  },
});

export const send = mutation({
  args: {
    experimentId: v.id("experiments"),
    role: v.string(),
    content: v.string(),
    agentRole: v.optional(v.string()),
    agentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      experimentId: args.experimentId,
      role: args.role,
      content: args.content,
      agentRole: args.agentRole,
      agentName: args.agentName,
    });
    return messageId;
  },
});

export const clear = mutation({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
  },
});
