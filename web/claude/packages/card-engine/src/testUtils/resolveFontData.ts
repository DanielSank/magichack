import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { FontStyle, FontWeight } from "../render/toSvgString.js";
import { MTG_FONT_VARIANTS } from "../styles/mtg/fonts/manifest.js";

const thisDir = dirname(fileURLToPath(import.meta.url));
// This file lives at src/testUtils/, so the package root is two levels up.
const packageRoot = resolve(thisDir, "../..");
const fontsDir = join(packageRoot, "src/styles/mtg/fonts");

/**
 * Reads a real mtg font file off disk (see ../styles/mtg/fonts/manifest.ts)
 * and returns a data: URI, for tests that want to exercise real font
 * resolution rather than a stub. Not exported from the package
 * (../../index.ts) — this is test-only, Node-fs-based glue, exactly the kind
 * of I/O card-engine itself deliberately avoids.
 */
export function resolveFontDataForTests(
  fontFamily: string,
  weight: FontWeight,
  style: FontStyle,
): string | undefined {
  const variant = MTG_FONT_VARIANTS.find(
    (v) => v.family === fontFamily && v.weight === weight && v.style === style,
  );
  if (!variant) return undefined;
  const bytes = readFileSync(join(fontsDir, variant.fileName));
  return `data:font/woff2;base64,${bytes.toString("base64")}`;
}
