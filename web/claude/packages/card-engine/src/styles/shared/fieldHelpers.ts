import type { AssetRef, FieldValues } from "../../schema/types.js";

/** Coerces a field value to a display string, defaulting to "" when absent. */
export function asString(value: FieldValues[string]): string {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

/** Coerces a field value to a list of strings, defaulting to [] when absent/invalid. */
export function asStringList(value: FieldValues[string]): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

/** Narrows a field value to an AssetRef (image fields), or undefined if not set/invalid. */
export function asAssetRef(value: FieldValues[string]): AssetRef | undefined {
  if (typeof value === "object" && value !== null && typeof (value as AssetRef).assetId === "string") {
    return value as AssetRef;
  }
  return undefined;
}
