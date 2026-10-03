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
import { findFontVariant, mimeTypeForExtension, toDataUri } from "../../src/render/resolverHelpers.js";
import { MTG_FONT_VARIANTS } from "../../src/styles/mtg/fonts/manifest.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
export const packageRoot = resolve(scriptDir, "../..");

export function resolveSymbolSvg(svgAssetPath: string): string {
  return readFileSync(join(packageRoot, svgAssetPath), "utf-8");
}

export function resolveRasterAsset(rasterAssetPath: string): string {
  const bytes = readFileSync(join(packageRoot, rasterAssetPath));
  return toDataUri(bytes.toString("base64"), mimeTypeForExtension(extname(rasterAssetPath)));
}

// See src/styles/mtg/fonts/manifest.ts for what these variants actually are
// (open-license stand-ins, not the real licensed MTG fonts).
export function resolveFontData(fontFamily: string, weight: FontWeight, style: FontStyle): string | undefined {
  const variant = findFontVariant(MTG_FONT_VARIANTS, fontFamily, weight, style);
  if (!variant) return undefined;
  const bytes = readFileSync(join(packageRoot, "src/styles/mtg/fonts", variant.fileName));
  return toDataUri(bytes.toString("base64"), "font/woff2");
}
