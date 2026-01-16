/**
 * Utility functions for schema manipulation
 */

import type { SchemaField, SchemaOp, AppSchema } from "../types";

/**
 * Valid field types
 */
export const VALID_FIELD_TYPES = [
  "string",
  "number",
  "boolean",
  "date",
  "relation",
] as const;

export type FieldType = (typeof VALID_FIELD_TYPES)[number];

/**
 * Check if a field type is valid
 */
export function isValidFieldType(type: string): type is FieldType {
  return VALID_FIELD_TYPES.includes(type as FieldType);
}

/**
 * Normalize table name to lowercase with underscores
 */
export function normalizeTableName(name: string): string {
  return name
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, "$1_$2") // camelCase to snake_case
    .replace(/[^a-z0-9]+/g, "_") // Replace non-alphanumeric with underscore
    .replace(/^_|_$/g, ""); // Remove leading/trailing underscores
}

/**
 * Normalize field name to lowercase with underscores
 */
export function normalizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Generate a unique schema key
 */
export function generateSchemaKey(projectUuid: string, tableName: string): string {
  return `${projectUuid}_${normalizeTableName(tableName)}`;
}

/**
 * Check if a table exists in the current schemas
 */
export function tableExists(
  tableName: string,
  schemas: AppSchema[]
): boolean {
  const normalizedName = normalizeTableName(tableName);
  return schemas.some((s) => normalizeTableName(s.tableName) === normalizedName);
}

/**
 * Check if a field exists in a table
 */
export function fieldExists(
  tableName: string,
  fieldName: string,
  schemas: AppSchema[]
): boolean {
  const normalizedTableName = normalizeTableName(tableName);
  const normalizedFieldName = normalizeFieldName(fieldName);
  const schema = schemas.find(
    (s) => normalizeTableName(s.tableName) === normalizedTableName
  );
  if (!schema) return false;
  return schema.fields.some(
    (f) => normalizeFieldName(f.name) === normalizedFieldName
  );
}

/**
 * Get a table schema by name
 */
export function getTableSchema(
  tableName: string,
  schemas: AppSchema[]
): AppSchema | undefined {
  const normalizedName = normalizeTableName(tableName);
  return schemas.find((s) => normalizeTableName(s.tableName) === normalizedName);
}

/**
 * Validate a schema field
 */
export function validateField(
  field: SchemaField
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!field.name || typeof field.name !== "string") {
    errors.push("Field name is required");
  } else if (!/^[a-z][a-z0-9_]*$/.test(normalizeFieldName(field.name))) {
    errors.push(
      `Invalid field name: ${field.name}. Must start with a letter and contain only lowercase letters, numbers, and underscores.`
    );
  }

  if (!isValidFieldType(field.type)) {
    errors.push(
      `Invalid field type: ${field.type}. Must be one of: ${VALID_FIELD_TYPES.join(", ")}`
    );
  }

  if (field.type === "relation" && !field.relationTo) {
    errors.push(`Relation field '${field.name}' must specify relationTo`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a complete table schema
 */
export function validateTableSchema(
  tableName: string,
  fields: SchemaField[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate table name
  if (!tableName || typeof tableName !== "string") {
    errors.push("Table name is required");
  } else if (!/^[a-z][a-z0-9_]*$/.test(normalizeTableName(tableName))) {
    errors.push(
      `Invalid table name: ${tableName}. Must start with a letter and contain only lowercase letters, numbers, and underscores.`
    );
  }

  // Validate fields
  if (!fields || !Array.isArray(fields) || fields.length === 0) {
    errors.push("Table must have at least one field");
  } else {
    const fieldNames = new Set<string>();
    for (const field of fields) {
      const fieldValidation = validateField(field);
      errors.push(...fieldValidation.errors);

      const normalizedName = normalizeFieldName(field.name);
      if (fieldNames.has(normalizedName)) {
        errors.push(`Duplicate field name: ${field.name}`);
      }
      fieldNames.add(normalizedName);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Suggest common fields based on table name
 */
export function suggestFieldsForTable(tableName: string): SchemaField[] {
  const normalized = normalizeTableName(tableName);
  const suggestions: SchemaField[] = [];

  // Common patterns based on table name
  if (normalized.includes("post") || normalized.includes("article")) {
    suggestions.push(
      { name: "title", type: "string", required: true },
      { name: "content", type: "string", required: true },
      { name: "published", type: "boolean", required: false },
      { name: "created_at", type: "date", required: true }
    );
  } else if (normalized.includes("user")) {
    suggestions.push(
      { name: "name", type: "string", required: true },
      { name: "email", type: "string", required: true },
      { name: "created_at", type: "date", required: true }
    );
  } else if (normalized.includes("task") || normalized.includes("todo")) {
    suggestions.push(
      { name: "title", type: "string", required: true },
      { name: "description", type: "string", required: false },
      { name: "completed", type: "boolean", required: false },
      { name: "due_date", type: "date", required: false },
      { name: "created_at", type: "date", required: true }
    );
  } else if (normalized.includes("comment")) {
    suggestions.push(
      { name: "content", type: "string", required: true },
      { name: "author_name", type: "string", required: false },
      { name: "created_at", type: "date", required: true }
    );
  } else if (normalized.includes("product")) {
    suggestions.push(
      { name: "name", type: "string", required: true },
      { name: "description", type: "string", required: false },
      { name: "price", type: "number", required: true },
      { name: "in_stock", type: "boolean", required: false },
      { name: "created_at", type: "date", required: true }
    );
  } else {
    // Default: just add created_at
    suggestions.push({ name: "created_at", type: "date", required: true });
  }

  return suggestions;
}

/**
 * Generate TypeScript interface from schema
 */
export function generateTypeScriptInterface(schema: AppSchema): string {
  const interfaceName = schema.tableName
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  const fieldLines = schema.fields.map((field) => {
    const tsType = fieldTypeToTypeScript(field.type);
    const optional = field.required ? "" : "?";
    return `  ${field.name}${optional}: ${tsType};`;
  });

  return `interface ${interfaceName} {\n  _id: string;\n${fieldLines.join("\n")}\n}`;
}

/**
 * Convert schema field type to TypeScript type
 */
function fieldTypeToTypeScript(type: string): string {
  switch (type) {
    case "string":
      return "string";
    case "number":
      return "number";
    case "boolean":
      return "boolean";
    case "date":
      return "number"; // Unix timestamp
    case "relation":
      return "string"; // ID reference
    default:
      return "unknown";
  }
}

/**
 * Apply schema operations to a list of schemas
 * Returns the updated schemas (for preview/validation)
 */
export function applySchemaOps(
  schemas: AppSchema[],
  ops: SchemaOp[],
  projectUuid: string
): AppSchema[] {
  let result = [...schemas];

  for (const op of ops) {
    switch (op.type) {
      case "createTable":
        result.push({
          key: generateSchemaKey(projectUuid, op.tableName),
          tableName: normalizeTableName(op.tableName),
          fields: op.fields.map((f) => ({
            ...f,
            name: normalizeFieldName(f.name),
          })),
        });
        break;
      case "addField":
        result = result.map((s) =>
          normalizeTableName(s.tableName) === normalizeTableName(op.tableName)
            ? {
                ...s,
                fields: [
                  ...s.fields,
                  { ...op.field, name: normalizeFieldName(op.field.name) },
                ],
              }
            : s
        );
        break;
      case "removeField":
        result = result.map((s) =>
          normalizeTableName(s.tableName) === normalizeTableName(op.tableName)
            ? {
                ...s,
                fields: s.fields.filter(
                  (f) =>
                    normalizeFieldName(f.name) !==
                    normalizeFieldName(op.fieldName)
                ),
              }
            : s
        );
        break;
      case "deleteTable":
        result = result.filter(
          (s) =>
            normalizeTableName(s.tableName) !== normalizeTableName(op.tableName)
        );
        break;
    }
  }

  return result;
}
