import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const experimentId = await ctx.db.insert("experiments", {
      name: args.name,
      description: args.description,
      status: "planning",
      currentPhase: "requirements",
    });
    return experimentId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("experiments").order("desc").collect();
  },
});

export const get = query({
  args: { id: v.id("experiments") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("experiments"),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const updatePhase = mutation({
  args: {
    id: v.id("experiments"),
    currentPhase: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { currentPhase: args.currentPhase });
  },
});

export const remove = mutation({
  args: { id: v.id("experiments") },
  handler: async (ctx, args) => {
    // Delete associated messages
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.id))
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // Delete associated blocks
    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.id))
      .collect();
    for (const block of blocks) {
      await ctx.db.delete(block._id);
    }

    // Delete the experiment
    await ctx.db.delete(args.id);
  },
});
