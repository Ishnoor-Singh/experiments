import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Layer types for categorizing blocks
const LayerType = v.union(
  v.literal("data"),
  v.literal("api"),
  v.literal("workflow"),
  v.literal("ux"),
  v.literal("infra"),
  v.literal("requirements")
);

// Block types based on the tools in block-tools.ts
const BlockType = v.union(
  // Data layer
  v.literal("entity"),
  v.literal("relationship"),
  v.literal("computed_field"),
  v.literal("index"),
  // API layer
  v.literal("endpoint"),
  // Workflow layer
  v.literal("workflow"),
  // UX layer
  v.literal("screen"),
  v.literal("component"),
  v.literal("design_tokens"),
  v.literal("user_flow"),
  // Infrastructure layer
  v.literal("auth"),
  v.literal("role"),
  v.literal("deployment"),
  // Requirements layer
  v.literal("requirement"),
  v.literal("persona"),
  v.literal("user_story")
);

/**
 * List all blocks for an experiment
 */
export const list = query({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("blocks")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();
  },
});

/**
 * List blocks filtered by layer
 */
export const listByLayer = query({
  args: {
    experimentId: v.id("experiments"),
    layer: LayerType,
  },
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();
    return blocks.filter((block) => block.layer === args.layer);
  },
});

/**
 * List blocks filtered by block type
 */
export const listByType = query({
  args: {
    experimentId: v.id("experiments"),
    blockType: BlockType,
  },
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();
    return blocks.filter((block) => block.blockType === args.blockType);
  },
});

/**
 * Get a single block by ID
 */
export const get = query({
  args: { blockId: v.id("blocks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.blockId);
  },
});

/**
 * Create a new block
 */
export const create = mutation({
  args: {
    experimentId: v.id("experiments"),
    layer: v.string(),
    blockType: v.string(),
    data: v.any(),
    createdBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const blockId = await ctx.db.insert("blocks", {
      experimentId: args.experimentId,
      layer: args.layer,
      blockType: args.blockType,
      data: args.data,
      createdBy: args.createdBy,
    });
    return blockId;
  },
});

/**
 * Update an existing block's data
 */
export const update = mutation({
  args: {
    blockId: v.id("blocks"),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.blockId, {
      data: args.data,
    });
    return args.blockId;
  },
});

/**
 * Delete a block
 */
export const remove = mutation({
  args: { blockId: v.id("blocks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.blockId);
  },
});

/**
 * Clear all blocks for an experiment
 */
export const clear = mutation({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();
    for (const block of blocks) {
      await ctx.db.delete(block._id);
    }
  },
});

/**
 * Get block counts by layer for an experiment
 */
export const getCountsByLayer = query({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();

    const counts: Record<string, number> = {
      data: 0,
      api: 0,
      workflow: 0,
      ux: 0,
      infra: 0,
      requirements: 0,
    };

    for (const block of blocks) {
      if (block.layer in counts) {
        counts[block.layer]++;
      }
    }

    return counts;
  },
});

/**
 * Get all blocks grouped by layer
 */
export const getGroupedByLayer = query({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => {
    const blocks = await ctx.db
      .query("blocks")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();

    const grouped: Record<string, typeof blocks> = {
      requirements: [],
      data: [],
      api: [],
      workflow: [],
      ux: [],
      infra: [],
    };

    for (const block of blocks) {
      if (block.layer in grouped) {
        grouped[block.layer].push(block);
      }
    }

    return grouped;
  },
});
