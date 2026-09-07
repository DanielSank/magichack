/**
 * Types describing a "game" — the set of attributes a card in that game has.
 * Games are statically defined by the application (see game-schemas/*.yaml),
 * never user-created.
 */

export type FieldType = "string" | "text" | "integer" | "boolean" | "enum" | "image" | "stringList";

interface BaseFieldDef {
  /** The access name for this field.*/
  key: string;
  /** The human readable field label, i.e. something we'd use in a web form. */
  label: string;
  /**
   * Optional required flag. If it's not present, it should be interpreted as false.
   * Normalized in load.ts.
  */
  required?: boolean;
}

export interface StringFieldDef extends BaseFieldDef {
  type: "string" | "text";
  maxLength?: number;
  /** Regex source, applied to the raw string value. */
  pattern?: string;
}

export interface IntegerFieldDef extends BaseFieldDef {
  type: "integer";
  min?: number;
  max?: number;
}

export interface BooleanFieldDef extends BaseFieldDef {
  type: "boolean";
}

export interface EnumFieldDef extends BaseFieldDef {
  type: "enum";
  values: string[];
}

export interface ImageFieldDef extends BaseFieldDef {
  type: "image";
}

/** A list of free-text entries, e.g. an mtg card's types/effects. */
export interface StringListFieldDef extends BaseFieldDef {
  type: "stringList";
}

export type FieldDef =
  | StringFieldDef
  | IntegerFieldDef
  | BooleanFieldDef
  | EnumFieldDef
  | ImageFieldDef
  | StringListFieldDef;

export interface GameSchema {
  id: string;
  name: string;
  /** Style id used when a card of this game doesn't specify one explicitly. */
  defaultStyleId: string;
  fields: FieldDef[];
}

/** Reference to an uploaded image asset. Used as the value of "image" fields. */
export interface AssetRef {
  assetId: string;
  /** Resolved URL, when known (e.g. after upload or fetch from the backend). */
  url?: string;
}

/** Structure-less representation of a card. */
export type FieldValues = Record<string, string | number | boolean | string[] | AssetRef | undefined>;
