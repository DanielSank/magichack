import type { FontStyle, FontWeight } from "../../../render/toSvgString.js";

/**
 * One embeddable font file: which (family, weight, style) it satisfies, and
 * the file to read for it. Pure data — no file I/O here, so this is safe to
 * import from anywhere (edge scripts, tests, and eventually a browser editor
 * wanting to `@font-face` these same files for live preview). The actual
 * reading of `fileName` off disk is edge-side glue (see
 * ../../../testUtils/resolveFontData.ts and scripts/renderDemo.ts), same
 * division of responsibility as resolveRasterAsset/resolveSymbolSvg.
 *
 * These are NOT the real named MTG fonts. Beleren is Wizards of the Coast's
 * own proprietary house font; MPlantin and Matrix are commercial
 * Monotype/Emigre fonts. None of those are freely embeddable/redistributable,
 * so until licensed copies are sourced, each logical name here is stood in
 * by a visually-similar open (SIL OFL 1.1) font from Google Fonts:
 *
 *   "Goudy Medieval" -> MedievalSharp
 *   "MPlantin"       -> EB Garamond
 *   "Matrix Bold"    -> PT Serif (bold)
 *   "Beleren Bold"   -> Cinzel (bold)
 *
 * Swap a file (and, if needed, add more weight/style entries below) once a
 * properly licensed copy of the real font is available — nothing else in
 * card-engine needs to change, since styles only ever reference the logical
 * family name.
 */
export interface FontVariant {
  family: string;
  weight: FontWeight;
  style: FontStyle;
  fileName: string;
}

export const MTG_FONT_VARIANTS: FontVariant[] = [
  { family: "Goudy Medieval", weight: "normal", style: "normal", fileName: "goudy-medieval-regular.woff2" },
  { family: "MPlantin", weight: "normal", style: "normal", fileName: "mplantin-regular.woff2" },
  { family: "MPlantin", weight: "normal", style: "italic", fileName: "mplantin-italic.woff2" },
  { family: "Matrix Bold", weight: "bold", style: "normal", fileName: "matrix-bold.woff2" },
  { family: "Beleren Bold", weight: "bold", style: "normal", fileName: "beleren-bold.woff2" },
];
