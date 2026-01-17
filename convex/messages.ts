import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

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
      v.literal("pending"),
      v.literal("streaming")
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

/**
 * Append content to a streaming message
 */
export const appendContent = mutation({
  args: {
    id: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.id);
    if (!message) return;

    await ctx.db.patch(args.id, {
      content: message.content + args.content,
    });
  },
});

/**
 * Create a streaming assistant message
 */
export const createStreaming = mutation({
  args: {
    projectUuid: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      projectUuid: args.projectUuid,
      role: "assistant",
      content: "",
      status: "streaming",
      timestamp: Date.now(),
    });
    return messageId;
  },
});

/**
 * Send a user message and trigger the AI agent to process it
 */
export const sendAndProcess = mutation({
  args: {
    projectUuid: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Create the user message with pending status
    const messageId = await ctx.db.insert("messages", {
      projectUuid: args.projectUuid,
      role: "user",
      content: args.content,
      status: "pending",
      timestamp: Date.now(),
    });

    // Schedule the agent action to process the message
    await ctx.scheduler.runAfter(0, api.agents.processMessage, {
      projectUuid: args.projectUuid,
      messageId,
      userMessage: args.content,
    });

    return messageId;
  },
});
