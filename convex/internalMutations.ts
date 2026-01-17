import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

/**
 * Internal mutation to update streaming message content
 * This runs in the Convex runtime (not Node.js) for real-time updates
 */
export const updateStreamingContent = internalMutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
    status: v.optional(
      v.union(
        v.literal("streaming"),
        v.literal("success"),
        v.literal("error")
      )
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      content: args.content,
      ...(args.status && { status: args.status }),
    });
  },
});
