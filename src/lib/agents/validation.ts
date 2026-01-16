import type {
  FileOp,
  SchemaOp,
  FileOpValidation,
  SchemaOpValidation,
  ProjectFile,
  AppSchema,
} from "./types";

/**
 * Valid file path pattern - must start with src/ or public/
 */
const VALID_PATH_PATTERN = /^(src|public)\//;

/**
 * Dangerous file patterns that should not be modified
 */
const DANGEROUS_PATHS = [
  /^\.env/,
  /node_modules/,
  /^package\.json$/,
  /^package-lock\.json$/,
  /^convex\//,
  /\.git/,
];

/**
 * Valid table name pattern - lowercase letters, numbers, underscores
 */
const VALID_TABLE_NAME = /^[a-z][a-z0-9_]*$/;

/**
 * Valid field name pattern - lowercase letters, numbers, underscores
 */
const VALID_FIELD_NAME = /^[a-z][a-z0-9_]*$/;

/**
 * Validate a single file operation
 */
export function validateFileOp(
  op: FileOp,
  existingFiles: ProjectFile[]
): FileOpValidation {
  const errors: string[] = [];

  // Check path format
  if (!op.path || typeof op.path !== "string") {
    errors.push("File path is required and must be a string");
    return { valid: false, errors };
  }

  // Check for dangerous paths
  for (const pattern of DANGEROUS_PATHS) {
    if (pattern.test(op.path)) {
      errors.push(`Cannot modify protected path: ${op.path}`);
      return { valid: false, errors };
    }
  }

  // Check valid path pattern
  if (!VALID_PATH_PATTERN.test(op.path)) {
    errors.push(`Path must start with src/ or public/: ${op.path}`);
  }

  // Type-specific validation
  switch (op.type) {
    case "create": {
      const exists = existingFiles.some((f) => f.path === op.path);
      if (exists) {
        errors.push(`File already exists: ${op.path}. Use 'update' instead.`);
      }
      if (!op.content || typeof op.content !== "string") {
        errors.push("Content is required for create operation");
      }
      break;
    }
    case "update": {
      const exists = existingFiles.some((f) => f.path === op.path);
      if (!exists) {
        errors.push(`File does not exist: ${op.path}. Use 'create' instead.`);
      }
      if (!op.content || typeof op.content !== "string") {
        errors.push("Content is required for update operation");
      }
      break;
    }
    case "delete": {
      const exists = existingFiles.some((f) => f.path === op.path);
      if (!exists) {
        errors.push(`File does not exist: ${op.path}`);
      }
      break;
    }
    default:
      errors.push(`Unknown file operation type: ${(op as FileOp).type}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate all file operations
 */
export function validateFileOps(
  ops: FileOp[],
  existingFiles: ProjectFile[]
): FileOpValidation {
  const allErrors: string[] = [];

  // Track files as they would be after each operation
  let currentFiles = [...existingFiles];

  for (const op of ops) {
    const validation = validateFileOp(op, currentFiles);
    allErrors.push(...validation.errors);

    // Update current files state for subsequent operations
    if (validation.valid) {
      switch (op.type) {
        case "create":
          currentFiles.push({ path: op.path, content: op.content });
          break;
        case "update":
          currentFiles = currentFiles.map((f) =>
            f.path === op.path ? { ...f, content: op.content } : f
          );
          break;
        case "delete":
          currentFiles = currentFiles.filter((f) => f.path !== op.path);
          break;
      }
    }
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}

/**
 * Validate a single schema operation
 */
export function validateSchemaOp(
  op: SchemaOp,
  existingSchemas: AppSchema[]
): SchemaOpValidation {
  const errors: string[] = [];

  switch (op.type) {
    case "createTable": {
      if (!VALID_TABLE_NAME.test(op.tableName)) {
        errors.push(
          `Invalid table name: ${op.tableName}. Must be lowercase letters, numbers, underscores, starting with a letter.`
        );
      }
      const exists = existingSchemas.some((s) => s.tableName === op.tableName);
      if (exists) {
        errors.push(`Table already exists: ${op.tableName}`);
      }
      if (!op.fields || !Array.isArray(op.fields) || op.fields.length === 0) {
        errors.push("Table must have at least one field");
      } else {
        for (const field of op.fields) {
          if (!VALID_FIELD_NAME.test(field.name)) {
            errors.push(
              `Invalid field name: ${field.name}. Must be lowercase letters, numbers, underscores, starting with a letter.`
            );
          }
          if (
            !["string", "number", "boolean", "date", "relation"].includes(
              field.type
            )
          ) {
            errors.push(`Invalid field type: ${field.type}`);
          }
          if (field.type === "relation" && !field.relationTo) {
            errors.push(
              `Relation field ${field.name} must specify relationTo`
            );
          }
        }
      }
      break;
    }
    case "addField": {
      const schema = existingSchemas.find((s) => s.tableName === op.tableName);
      if (!schema) {
        errors.push(`Table does not exist: ${op.tableName}`);
      } else {
        const fieldExists = schema.fields.some(
          (f) => f.name === op.field.name
        );
        if (fieldExists) {
          errors.push(
            `Field already exists: ${op.field.name} in table ${op.tableName}`
          );
        }
      }
      if (!VALID_FIELD_NAME.test(op.field.name)) {
        errors.push(`Invalid field name: ${op.field.name}`);
      }
      break;
    }
    case "removeField": {
      const schema = existingSchemas.find((s) => s.tableName === op.tableName);
      if (!schema) {
        errors.push(`Table does not exist: ${op.tableName}`);
      } else {
        const fieldExists = schema.fields.some(
          (f) => f.name === op.fieldName
        );
        if (!fieldExists) {
          errors.push(
            `Field does not exist: ${op.fieldName} in table ${op.tableName}`
          );
        }
      }
      break;
    }
    case "deleteTable": {
      const exists = existingSchemas.some((s) => s.tableName === op.tableName);
      if (!exists) {
        errors.push(`Table does not exist: ${op.tableName}`);
      }
      break;
    }
    default:
      errors.push(`Unknown schema operation type: ${(op as SchemaOp).type}`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate all schema operations
 */
export function validateSchemaOps(
  ops: SchemaOp[],
  existingSchemas: AppSchema[]
): SchemaOpValidation {
  const allErrors: string[] = [];

  // Track schemas as they would be after each operation
  let currentSchemas = [...existingSchemas];

  for (const op of ops) {
    const validation = validateSchemaOp(op, currentSchemas);
    allErrors.push(...validation.errors);

    // Update current schemas state for subsequent operations
    if (validation.valid) {
      switch (op.type) {
        case "createTable":
          currentSchemas.push({
            key: `${op.tableName}_key`,
            tableName: op.tableName,
            fields: op.fields,
          });
          break;
        case "addField":
          currentSchemas = currentSchemas.map((s) =>
            s.tableName === op.tableName
              ? { ...s, fields: [...s.fields, op.field] }
              : s
          );
          break;
        case "removeField":
          currentSchemas = currentSchemas.map((s) =>
            s.tableName === op.tableName
              ? { ...s, fields: s.fields.filter((f) => f.name !== op.fieldName) }
              : s
          );
          break;
        case "deleteTable":
          currentSchemas = currentSchemas.filter(
            (s) => s.tableName !== op.tableName
          );
          break;
      }
    }
  }

  return { valid: allErrors.length === 0, errors: allErrors };
}
