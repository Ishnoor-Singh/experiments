import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Main experiment record
  experiments: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    status: v.string(), // planning | generating | testing | complete | failed
    currentPhase: v.string(), // requirements | ux-design | frontend | backend | integration | documentation
  }).index("by_status", ["status"]),

  // Chat messages
  messages: defineTable({
    experimentId: v.id("experiments"),
    role: v.string(), // user | assistant
    content: v.string(),
    agentRole: v.optional(v.string()),
    agentName: v.optional(v.string()),
  }).index("by_experiment", ["experimentId"]),

  // Structured spec blocks from planning tools
  blocks: defineTable({
    experimentId: v.id("experiments"),
    layer: v.string(), // data | api | workflow | ux | infra
    blockType: v.string(), // entity | endpoint | screen | component | etc.
    data: v.any(),
    createdBy: v.optional(v.string()), // agent role that created this
  }).index("by_experiment", ["experimentId"]),
});
