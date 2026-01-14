import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Language detection based on file extension
function detectLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    ts: "typescript",
    tsx: "typescript",
    js: "javascript",
    jsx: "javascript",
    css: "css",
    json: "json",
    md: "markdown",
    html: "html",
    yml: "yaml",
    yaml: "yaml",
  };
  return langMap[ext || ""] || "plaintext";
}

/**
 * List all generated files for an experiment
 */
export const list = query({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generated_files")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();
  },
});

/**
 * Get a file by its path
 */
export const getByPath = query({
  args: {
    experimentId: v.id("experiments"),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("generated_files")
      .withIndex("by_path", (q) =>
        q.eq("experimentId", args.experimentId).eq("path", args.path)
      )
      .first();
  },
});

/**
 * Get a file by ID
 */
export const get = query({
  args: { fileId: v.id("generated_files") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.fileId);
  },
});

/**
 * Create or update a generated file
 */
export const upsert = mutation({
  args: {
    experimentId: v.id("experiments"),
    path: v.string(),
    content: v.string(),
    description: v.optional(v.string()),
    generatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("generated_files")
      .withIndex("by_path", (q) =>
        q.eq("experimentId", args.experimentId).eq("path", args.path)
      )
      .first();

    const now = Date.now();
    const language = detectLanguage(args.path);

    if (existing) {
      // Update existing file
      await ctx.db.patch(existing._id, {
        content: args.content,
        description: args.description,
        generatedBy: args.generatedBy,
        version: existing.version + 1,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new file
      const fileId = await ctx.db.insert("generated_files", {
        experimentId: args.experimentId,
        path: args.path,
        content: args.content,
        description: args.description,
        language,
        generatedBy: args.generatedBy,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });
      return fileId;
    }
  },
});

/**
 * Delete a generated file
 */
export const remove = mutation({
  args: { fileId: v.id("generated_files") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.fileId);
  },
});

/**
 * Delete a file by path
 */
export const removeByPath = mutation({
  args: {
    experimentId: v.id("experiments"),
    path: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("generated_files")
      .withIndex("by_path", (q) =>
        q.eq("experimentId", args.experimentId).eq("path", args.path)
      )
      .first();
    if (file) {
      await ctx.db.delete(file._id);
    }
  },
});

/**
 * Clear all generated files for an experiment
 */
export const clear = mutation({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("generated_files")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();
    for (const file of files) {
      await ctx.db.delete(file._id);
    }
  },
});

/**
 * Get file tree structure
 */
export const getTree = query({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("generated_files")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();

    // Build tree structure
    const tree: Record<string, { path: string; fileId: string; language: string }[]> = {};

    for (const file of files) {
      const dir = file.path.split("/").slice(0, -1).join("/") || "/";
      if (!tree[dir]) {
        tree[dir] = [];
      }
      tree[dir].push({
        path: file.path,
        fileId: file._id,
        language: file.language,
      });
    }

    return tree;
  },
});

/**
 * Get file statistics
 */
export const getStats = query({
  args: { experimentId: v.id("experiments") },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("generated_files")
      .withIndex("by_experiment", (q) => q.eq("experimentId", args.experimentId))
      .collect();

    const stats = {
      totalFiles: files.length,
      totalLines: 0,
      byLanguage: {} as Record<string, number>,
      byDirectory: {} as Record<string, number>,
    };

    for (const file of files) {
      // Count lines
      stats.totalLines += file.content.split("\n").length;

      // Count by language
      stats.byLanguage[file.language] = (stats.byLanguage[file.language] || 0) + 1;

      // Count by directory
      const dir = file.path.split("/").slice(0, -1).join("/") || "/";
      stats.byDirectory[dir] = (stats.byDirectory[dir] || 0) + 1;
    }

    return stats;
  },
});
