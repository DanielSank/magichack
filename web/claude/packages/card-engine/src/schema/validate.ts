import type { FieldDef, FieldValues, GameSchema } from "./types.js";

export interface FieldError {
  key: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: FieldError[];
}

/**
 * Validates a card's field values against its game schema.
 *
 * This logic is intentionally simple and self-contained (no external
 * validation library) because it has a hand-written mirror in the Python
 * backend (apps/server/app/game_schema/validate.py) — the two are kept in
 * sync via a shared fixture suite (see game-schemas' sibling test fixtures),
 * not by sharing code across languages. Keep any change here small and
 * mirror it on the Python side.
 */
export function validateFieldValues(schema: GameSchema, values: FieldValues): ValidationResult {
  const errors: FieldError[] = [];
  const knownKeys = new Set(schema.fields.map((f) => f.key));

  for (const key of Object.keys(values)) {
    if (!knownKeys.has(key)) {
      errors.push({ key, message: `Unknown field "${key}" for game "${schema.id}"` });
    }
  }

  for (const field of schema.fields) {
    const value = values[field.key];
    const isEmpty =
      value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      if (field.required) {
        errors.push({ key: field.key, message: `"${field.label}" is required` });
      }
      continue;
    }

    validateFieldValue(field, value, errors);
  }

  return { valid: errors.length === 0, errors };
}

function validateFieldValue(
  field: FieldDef,
  value: NonNullable<FieldValues[string]>,
  errors: FieldError[],
): void {
  switch (field.type) {
    case "string":
    case "text": {
      if (typeof value !== "string") {
        errors.push({ key: field.key, message: `"${field.label}" must be a string` });
        return;
      }
      if (field.maxLength !== undefined && value.length > field.maxLength) {
        errors.push({
          key: field.key,
          message: `"${field.label}" must be at most ${field.maxLength} characters`,
        });
      }
      if (field.pattern !== undefined && !new RegExp(field.pattern).test(value)) {
        errors.push({ key: field.key, message: `"${field.label}" does not match the required format` });
      }
      return;
    }
    case "integer": {
      if (typeof value !== "number" || !Number.isInteger(value)) {
        errors.push({ key: field.key, message: `"${field.label}" must be an integer` });
        return;
      }
      if (field.min !== undefined && value < field.min) {
        errors.push({ key: field.key, message: `"${field.label}" must be at least ${field.min}` });
      }
      if (field.max !== undefined && value > field.max) {
        errors.push({ key: field.key, message: `"${field.label}" must be at most ${field.max}` });
      }
      return;
    }
    case "boolean": {
      if (typeof value !== "boolean") {
        errors.push({ key: field.key, message: `"${field.label}" must be true or false` });
      }
      return;
    }
    case "enum": {
      if (typeof value !== "string" || !field.values.includes(value)) {
        errors.push({
          key: field.key,
          message: `"${field.label}" must be one of: ${field.values.join(", ")}`,
        });
      }
      return;
    }
    case "image": {
      if (typeof value !== "object" || value === null || typeof (value as { assetId?: unknown }).assetId !== "string") {
        errors.push({ key: field.key, message: `"${field.label}" must be a valid uploaded image` });
      }
      return;
    }
    case "stringList": {
      if (!Array.isArray(value) || value.some((v) => typeof v !== "string")) {
        errors.push({ key: field.key, message: `"${field.label}" must be a list of strings` });
      }
      return;
    }
  }
}
