import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Create a new job for tracking background agent work
 */
export const create = mutation({
  args: {
    experimentId: v.id("experiments"),
    type: v.string(), // "agent_chat"
    input: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const jobId = await ctx.db.insert("jobs", {
      experimentId: args.experimentId,
      type: args.type,
      status: "pending",
      input: args.input,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return jobId;
  },
});

/**
 * Update job status
 */
export const updateStatus = mutation({
  args: {
    jobId: v.id("jobs"),
    status: v.string(), // "pending" | "running" | "completed" | "failed"
    result: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.jobId, {
      status: args.status,
      result: args.result,
      error: args.error,
      updatedAt: Date.now(),
      ...(args.status === "completed" || args.status === "failed"
        ? { completedAt: Date.now() }
        : {}),
    });
  },
});

/**
 * Get job by ID
 */
export const get = query({
  args: {
    jobId: v.id("jobs"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

/**
 * Get active job for an experiment
 */
export const getActiveForExperiment = query({
  args: {
    experimentId: v.id("experiments"),
  },
  handler: async (ctx, args) => {
    const jobs = await ctx.db
      .query("jobs")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .filter((q) =>
        q.or(q.eq(q.field("status"), "pending"), q.eq(q.field("status"), "running"))
      )
      .order("desc")
      .first();
    return jobs;
  },
});

/**
 * List recent jobs for an experiment
 */
export const listForExperiment = query({
  args: {
    experimentId: v.id("experiments"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    return await ctx.db
      .query("jobs")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .order("desc")
      .take(limit);
  },
});
