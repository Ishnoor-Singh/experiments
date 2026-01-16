import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    schemaKey: v.string(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("appRecords")
      .withIndex("by_schema", (q) => q.eq("schemaKey", args.schemaKey))
      .collect();
    return records;
  },
});

export const get = query({
  args: {
    id: v.id("appRecords"),
  },
  handler: async (ctx, args) => {
    const record = await ctx.db.get(args.id);
    return record;
  },
});

export const create = mutation({
  args: {
    schemaKey: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const recordId = await ctx.db.insert("appRecords", {
      schemaKey: args.schemaKey,
      data: args.data,
      createdAt: now,
      updatedAt: now,
    });
    return recordId;
  },
});

export const update = mutation({
  args: {
    id: v.id("appRecords"),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      data: args.data,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("appRecords"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
