import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Activity types tracked during agent execution
 */
export const ActivityType = v.union(
  v.literal("agent_start"),
  v.literal("agent_complete"),
  v.literal("tool_use"),
  v.literal("phase_change"),
  v.literal("block_created"),
  v.literal("error")
);

/**
 * Create a new activity for an experiment
 */
export const create = mutation({
  args: {
    experimentId: v.id("experiments"),
    type: ActivityType,
    agentRole: v.optional(v.string()),
    agentName: v.optional(v.string()),
    phase: v.optional(v.string()),
    tool: v.optional(v.string()),
    blockType: v.optional(v.string()),
    blockId: v.optional(v.string()),
    error: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const activity = await ctx.db.insert("activities", {
      experimentId: args.experimentId,
      type: args.type,
      agentRole: args.agentRole,
      agentName: args.agentName,
      phase: args.phase,
      tool: args.tool,
      blockType: args.blockType,
      blockId: args.blockId,
      error: args.error,
      metadata: args.metadata,
      timestamp: Date.now(),
    });
    return activity;
  },
});

/**
 * List activities for an experiment
 */
export const list = query({
  args: {
    experimentId: v.id("experiments"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    const activities = await ctx.db
      .query("activities")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .order("desc")
      .take(limit);

    return activities;
  },
});

/**
 * Clear all activities for an experiment (useful for testing)
 */
export const clear = mutation({
  args: {
    experimentId: v.id("experiments"),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();

    for (const activity of activities) {
      await ctx.db.delete(activity._id);
    }

    return { deleted: activities.length };
  },
});

/**
 * Get activity statistics for an experiment
 */
export const stats = query({
  args: {
    experimentId: v.id("experiments"),
  },
  handler: async (ctx, args) => {
    const activities = await ctx.db
      .query("activities")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();

    const stats = {
      total: activities.length,
      byType: {} as Record<string, number>,
      byAgent: {} as Record<string, number>,
      errors: 0,
      toolUses: 0,
    };

    for (const activity of activities) {
      // Count by type
      stats.byType[activity.type] = (stats.byType[activity.type] || 0) + 1;

      // Count by agent
      if (activity.agentRole) {
        stats.byAgent[activity.agentRole] = (stats.byAgent[activity.agentRole] || 0) + 1;
      }

      // Count errors
      if (activity.type === "error") {
        stats.errors++;
      }

      // Count tool uses
      if (activity.type === "tool_use") {
        stats.toolUses++;
      }
    }

    return stats;
  },
});