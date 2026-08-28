import { load as parseYaml } from "js-yaml";
import type { FieldDef, GameSchema } from "./types.js";

const VALID_FIELD_TYPES = new Set(["string", "text", "integer", "boolean", "enum", "image", "stringList"]);

export class GameSchemaParseError extends Error {}

/**
 * Parses a game schema from raw YAML text.
 *
 * Deliberately takes a string rather than a file path: card-engine has no
 * dependency on Node's `fs` or any other I/O API, so it stays usable
 * unmodified in the browser (Vite can inline the YAML text at build time)
 * and in any future Node-based render service. Callers are responsible for
 * getting the YAML text from wherever makes sense for their environment.
 */
export function parseGameSchema(yamlText: string): GameSchema {
  const raw = parseYaml(yamlText);
  if (typeof raw !== "object" || raw === null) {
    throw new GameSchemaParseError("Game schema YAML must parse to an object");
  }

  const obj = raw as Record<string, unknown>;
  for (const key of ["id", "name", "defaultStyleId", "fields"]) {
    if (!(key in obj)) {
      throw new GameSchemaParseError(`Game schema is missing required key "${key}"`);
    }
  }

  if (typeof obj.id !== "string" || obj.id.length === 0) {
    throw new GameSchemaParseError('Game schema "id" must be a non-empty string');
  }
  if (typeof obj.name !== "string" || obj.name.length === 0) {
    throw new GameSchemaParseError('Game schema "name" must be a non-empty string');
  }
  if (typeof obj.defaultStyleId !== "string" || obj.defaultStyleId.length === 0) {
    throw new GameSchemaParseError('Game schema "defaultStyleId" must be a non-empty string');
  }
  if (!Array.isArray(obj.fields)) {
    throw new GameSchemaParseError('Game schema "fields" must be an array');
  }

  const fields = obj.fields.map((f, i) => parseFieldDef(f, i, obj.id as string));

  const seenKeys = new Set<string>();
  for (const field of fields) {
    if (seenKeys.has(field.key)) {
      throw new GameSchemaParseError(`Game "${obj.id}" has duplicate field key "${field.key}"`);
    }
    seenKeys.add(field.key);
  }

  return {
    id: obj.id,
    name: obj.name,
    defaultStyleId: obj.defaultStyleId,
    fields,
  };
}

function parseFieldDef(raw: unknown, index: number, gameId: string): FieldDef {
  if (typeof raw !== "object" || raw === null) {
    throw new GameSchemaParseError(`Game "${gameId}" field[${index}] must be an object`);
  }
  const f = raw as Record<string, unknown>;

  if (typeof f.key !== "string" || f.key.length === 0) {
    throw new GameSchemaParseError(`Game "${gameId}" field[${index}] is missing a valid "key"`);
  }
  if (typeof f.label !== "string" || f.label.length === 0) {
    throw new GameSchemaParseError(`Game "${gameId}" field "${f.key}" is missing a valid "label"`);
  }
  if (typeof f.type !== "string" || !VALID_FIELD_TYPES.has(f.type)) {
    throw new GameSchemaParseError(
      `Game "${gameId}" field "${f.key}" has invalid type "${String(f.type)}"`,
    );
  }

  const required = f.required === true;

  switch (f.type) {
    case "string":
    case "text":
      return {
        key: f.key,
        label: f.label,
        type: f.type,
        required,
        maxLength: typeof f.maxLength === "number" ? f.maxLength : undefined,
        pattern: typeof f.pattern === "string" ? f.pattern : undefined,
      };
    case "integer":
      return {
        key: f.key,
        label: f.label,
        type: "integer",
        required,
        min: typeof f.min === "number" ? f.min : undefined,
        max: typeof f.max === "number" ? f.max : undefined,
      };
    case "boolean":
      return { key: f.key, label: f.label, type: "boolean", required };
    case "enum": {
      if (!Array.isArray(f.values) || f.values.some((v) => typeof v !== "string")) {
        throw new GameSchemaParseError(
          `Game "${gameId}" field "${f.key}" of type "enum" must have a string[] "values"`,
        );
      }
      return { key: f.key, label: f.label, type: "enum", required, values: f.values as string[] };
    }
    case "image":
      return { key: f.key, label: f.label, type: "image", required };
    case "stringList":
      return { key: f.key, label: f.label, type: "stringList", required };
    default:
      // Unreachable given the VALID_FIELD_TYPES check above.
      throw new GameSchemaParseError(`Unhandled field type for "${f.key}"`);
  }
}
