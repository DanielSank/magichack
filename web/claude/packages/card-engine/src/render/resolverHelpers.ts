/**
 * Pure, environment-agnostic lookup logic shared by every edge's ToSvgOptions
 * resolvers (packages/card-engine/scripts/lib/assetResolvers.ts for Node,
 * apps/web/src/render/browserToSvgOptions.ts for the browser). The actual
 * I/O (readFileSync vs. fetch/import.meta.glob) and raw byte-to-base64
 * mechanics (Buffer vs. chunked btoa) are genuinely different per platform
 * and stay separate — this file is only the part with nothing environment-
 * specific about it, so both edges can share one definition instead of two
 * that could silently drift (see TODO.md item 4, which this resolves).
 */
import type { FontVariant } from "../styles/mtg/fonts/manifest.js";
import type { FontStyle, FontWeight } from "./toSvgString.js";

const RASTER_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

/** `extension` includes the leading dot (e.g. ".png"), matching `node:path`'s `extname()`. */
export function mimeTypeForExtension(extension: string): string {
  return RASTER_MIME_TYPES[extension.toLowerCase()] ?? "application/octet-stream";
}

export function toDataUri(base64: string, mimeType: string): string {
  return `data:${mimeType};base64,${base64}`;
}

export function findFontVariant(
  variants: FontVariant[],
  family: string,
  weight: FontWeight,
  style: FontStyle,
): FontVariant | undefined {
  return variants.find((v) => v.family === family && v.weight === weight && v.style === style);
}
