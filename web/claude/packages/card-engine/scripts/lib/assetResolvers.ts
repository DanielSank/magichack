/**
 * Node-fs-based I/O lives here, at the edge - card-engine itself stays free
 * of any file/browser API so it can run unmodified elsewhere later. Shared
 * between renderDemo.ts and renderGrid.ts (and any future edge script that
 * needs to feed a RenderTree to toSvgString).
 */
import { readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { FontStyle, FontWeight } from "../../src/render/toSvgString.js";
import { MTG_FONT_VARIANTS } from "../../src/styles/mtg/fonts/manifest.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
export const packageRoot = resolve(scriptDir, "../..");

export function resolveSymbolSvg(svgAssetPath: string): string {
  return readFileSync(join(packageRoot, svgAssetPath), "utf-8");
}

const RASTER_MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

export function resolveRasterAsset(rasterAssetPath: string): string {
  const bytes = readFileSync(join(packageRoot, rasterAssetPath));
  const mimeType = RASTER_MIME_TYPES[extname(rasterAssetPath).toLowerCase()] ?? "application/octet-stream";
  return `data:${mimeType};base64,${bytes.toString("base64")}`;
}

// See src/styles/mtg/fonts/manifest.ts for what these variants actually are
// (open-license stand-ins, not the real licensed MTG fonts).
export function resolveFontData(fontFamily: string, weight: FontWeight, style: FontStyle): string | undefined {
  const variant = MTG_FONT_VARIANTS.find(
    (v) => v.family === fontFamily && v.weight === weight && v.style === style,
  );
  if (!variant) return undefined;
  const bytes = readFileSync(join(packageRoot, "src/styles/mtg/fonts", variant.fileName));
  return `data:font/woff2;base64,${bytes.toString("base64")}`;
}
