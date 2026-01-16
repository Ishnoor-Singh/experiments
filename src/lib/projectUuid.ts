import { nanoid } from "nanoid";

/**
 * Generate a project UUID in the format: p_{nanoid(12)}
 * Example: p_a1b2c3d4e5f6
 */
export function generateProjectUuid(): string {
  return `p_${nanoid(12)}`;
}

/**
 * Validate a project UUID format
 */
export function isValidProjectUuid(uuid: string): boolean {
  return /^p_[a-zA-Z0-9_-]{12}$/.test(uuid);
}

/**
 * Generate a schema key for a table in a project
 * Format: {projectUuid}_{tableName}
 * Example: p_a1b2c3d4e5f6_posts
 */
export function generateSchemaKey(
  projectUuid: string,
  tableName: string
): string {
  return `${projectUuid}_${tableName}`;
}
