import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { api } from "./_generated/api";

/**
 * Retry a failed message by re-triggering the agent
 */
export const retryMessage = mutation({
  args: {
    projectUuid: v.string(),
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const { projectUuid, messageId } = args;

    // Get the original message
    const message = await ctx.db.get(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    if (message.role !== "user") {
      throw new Error("Can only retry user messages");
    }

    // Update status to pending
    await ctx.db.patch(messageId, {
      status: "pending",
      error: undefined,
    });

    // Delete any existing assistant responses for this message
    // (They would have been created as error responses)
    const responses = await ctx.db
      .query("messages")
      .withIndex("by_project", (q) => q.eq("projectUuid", projectUuid))
      .collect();

    // Find and delete error responses that came after this message
    const messageTimestamp = message.timestamp ?? 0;
    for (const response of responses) {
      if (
        response.role === "assistant" &&
        response.status === "error" &&
        (response.timestamp ?? 0) > messageTimestamp
      ) {
        await ctx.db.delete(response._id);
      }
    }

    // Re-trigger the agent
    await ctx.scheduler.runAfter(0, api.agents.processMessage, {
      projectUuid,
      messageId,
      userMessage: message.content,
    });

    return messageId;
  },
});

/**
 * Clear all error messages for a project (useful for cleanup)
 */
export const clearErrors = mutation({
  args: {
    projectUuid: v.string(),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_project", (q) => q.eq("projectUuid", args.projectUuid))
      .collect();

    let deletedCount = 0;
    for (const message of messages) {
      if (message.status === "error") {
        await ctx.db.delete(message._id);
        deletedCount++;
      }
    }

    return { deletedCount };
  },
});
