/**
 * Real per-glyph advance-width measurement for the demo/grid scripts, using
 * the actual embedded font files (see ../../src/styles/mtg/fonts/manifest.ts)
 * instead of toSvgString's built-in flat-average fallback. That fallback
 * treats every character as the same width, which — since each word is
 * positioned by an explicit cursor advance rather than natural text flow —
 * showed up as visible extra gap after any narrow token (a lone "1" was
 * estimated ~58% too wide). Node-only (uses fontkit + real file I/O), so —
 * like the other resolvers in this directory — this lives at the edge, not
 * in card-engine itself.
 *
 * ToSvgOptions.measureText gets the same (family, weight, style) triple
 * resolveFontData does, so this looks up the exact variant actually being
 * rendered — matching by family alone first measured every MPlantin string
 * (including italic flavor text) against the upright glyphs, which run
 * narrower than the italic ones and made italic text visibly crowd.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as fontkit from "fontkit";

import { defaultMeasureText } from "../../src/render/toSvgString.js";
import type { FontStyle, FontWeight } from "../../src/render/toSvgString.js";
import { MTG_FONT_VARIANTS } from "../../src/styles/mtg/fonts/manifest.js";
import { packageRoot } from "./assetResolvers.js";

const fontCache = new Map<string, fontkit.Font>();

function loadFont(fileName: string): fontkit.Font {
  let font = fontCache.get(fileName);
  if (!font) {
    const buffer = readFileSync(join(packageRoot, "src/styles/mtg/fonts", fileName));
    font = fontkit.create(buffer);
    fontCache.set(fileName, font);
  }
  return font;
}

export function measureText(
  text: string,
  fontSize: number,
  fontFamily: string,
  weight: FontWeight,
  style: FontStyle,
): number {
  const variant = MTG_FONT_VARIANTS.find((v) => v.family === fontFamily && v.weight === weight && v.style === style);
  // No embedded file for this exact variant (e.g. "Georgia, serif", which
  // has no manifest entry at all) — fall back to the same guess toSvgString
  // itself uses, rather than measuring against the wrong variant's glyphs.
  if (!variant) return defaultMeasureText(text, fontSize);
  const font = loadFont(variant.fileName);
  return (font.layout(text).advanceWidth / font.unitsPerEm) * fontSize;
}
