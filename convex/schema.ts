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

  // Agent activity tracking
  activities: defineTable({
    experimentId: v.id("experiments"),
    type: v.string(), // agent_start | agent_complete | tool_use | phase_change | block_created | error
    agentRole: v.optional(v.string()),
    agentName: v.optional(v.string()),
    phase: v.optional(v.string()),
    tool: v.optional(v.string()),
    blockType: v.optional(v.string()),
    blockId: v.optional(v.string()),
    error: v.optional(v.string()),
    metadata: v.optional(v.any()),
    timestamp: v.number(),
  }).index("by_experiment", ["experimentId"]),

  // Background job tracking
  jobs: defineTable({
    experimentId: v.id("experiments"),
    type: v.string(), // agent_chat
    status: v.string(), // pending | running | completed | failed
    input: v.optional(v.any()),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    completedAt: v.optional(v.number()),
  }).index("by_experiment", ["experimentId"]),
});
