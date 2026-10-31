/**
 * The browser's implementation of ToSvgOptions' injected callbacks — the
 * counterpart to card-engine's Node-only scripts/lib/{assetResolvers,measureText}.ts.
 * Neither file can be shared: those use `fs`/fontkit, this uses Vite's
 * `import.meta.glob` + the Fetch/Canvas APIs. Same contract, different edge.
 * The environment-agnostic lookup logic both edges need (MIME-type table,
 * data: URI formatting) lives once in card-engine's resolverHelpers.ts and
 * is imported by both — see its own docstring.
 *
 * `measureText` uses the Canvas 2D API's own `measureText`, which asks the
 * browser's real font engine for true per-glyph advance widths — same goal
 * as the Node side's fontkit-based measurement (scripts/lib/measureText.ts),
 * different mechanism, because fontkit (binary font-file parsing) has no
 * browser equivalent. This only works because every embedded font variant is
 * also registered as a real `FontFace` below — without that, Canvas would
 * silently measure against a fallback system font instead of the actual
 * embedded one.
 */
import type { FontStyle, FontWeight, ToSvgOptions } from "@magichack/card-engine";
import {
  defaultMeasureText,
  findFontVariant,
  mimeTypeForExtension,
  mimeTypeForFontExtension,
  MTG_FONT_VARIANTS,
  toDataUri,
} from "@magichack/card-engine";

// Eager + raw: every symbol/background SVG's markup, inlined at build time.
// Keys come back as the literal matched path relative to this file, e.g.
// "../../../../packages/card-engine/assets/symbols/suit-hearts.svg" — stripped
// down below to the package-root-relative form SymbolDef.svgAssetPath actually uses.
const rawSvgModules = {
  ...import.meta.glob("../../../../packages/card-engine/assets/symbols/*.svg", {
    eager: true,
    query: "?raw",
    import: "default",
  }),
  ...import.meta.glob("../../../../packages/card-engine/assets/symbols-mtg-small/*.svg", {
    eager: true,
    query: "?raw",
    import: "default",
  }),
  ...import.meta.glob("../../../../packages/card-engine/src/styles/mtg/holoFoil/*.svg", {
    eager: true,
    query: "?raw",
    import: "default",
  }),
} as Record<string, string>;

const CARD_ENGINE_PREFIX = "../../../../packages/card-engine/";

// Both the SVG and raster loops below need this same translation (a glob
// key relative to this file -> the package-root-relative path the registries
// actually use as their id) — one helper instead of two inlined copies.
function toPackageRootPath(globKey: string): string {
  return globKey.startsWith(CARD_ENGINE_PREFIX) ? globKey.slice(CARD_ENGINE_PREFIX.length) : globKey;
}

const SVG_BY_PACKAGE_ROOT_PATH: Record<string, string> = {};
for (const [key, content] of Object.entries(rawSvgModules)) {
  SVG_BY_PACKAGE_ROOT_PATH[toPackageRootPath(key)] = content;
}

function resolveSymbolSvg(svgAssetPath: string): string {
  const svg = SVG_BY_PACKAGE_ROOT_PATH[svgAssetPath];
  if (svg === undefined) {
    throw new Error(
      `No bundled SVG for "${svgAssetPath}" — keys are: ${Object.keys(SVG_BY_PACKAGE_ROOT_PATH).join(", ")}`,
    );
  }
  return svg;
}

// Eager + url: each font/raster file's real, fetchable URL (both binary, so
// ?raw would corrupt them — ?url gets Vite's normal asset handling instead).
const fontUrlModules = import.meta.glob("../../../../packages/card-engine/src/styles/mtg/fonts/*.{woff2,woff,ttf,otf}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

const rasterUrlModules = import.meta.glob(
  [
    "../../../../packages/card-engine/src/styles/**/*.{png,jpg,jpeg}",
    "../../../../packages/card-engine/assets/symbols-mtg-small/*.{png,jpg,jpeg}",
    "../../../../packages/card-engine/assets/symbols-mtg-large/*.{png,jpg,jpeg}",
  ],
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>;

function fontUrlForFileName(fileName: string): string | undefined {
  const entry = Object.entries(fontUrlModules).find(([key]) => key.endsWith(`/${fileName}`));
  return entry?.[1];
}

// Spreading a whole large typed array as call arguments
// (String.fromCharCode(...bytes)) blows the call stack well before a
// realistic image's byte count (frame.png alone is 1.6MB) — chunking keeps
// each call well under any engine's argument-count limit.
const BASE64_CHUNK_SIZE = 0x8000;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK_SIZE));
  }
  return btoa(binary);
}

async function urlToDataUri(url: string, mimeType: string): Promise<string> {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  return toDataUri(bytesToBase64(bytes), mimeType);
}

// Fetching + base64-encoding is async, but resolveFontData/resolveRasterAsset
// are synchronous (mirrors the Node side's sync readFileSync) — so every
// font/raster asset's data: URI is resolved once, up front, cached before
// rendering starts.
const fontDataCache = new Map<string, string>();
const rasterDataCache = new Map<string, string>();

async function loadAssetCaches(): Promise<void> {
  const fontLoads = MTG_FONT_VARIANTS.map(async (variant) => {
    const url = fontUrlForFileName(variant.fileName);
    if (!url) return; // handled as "unrecognized variant" by resolveFontData below
    const extension = variant.fileName.slice(variant.fileName.lastIndexOf("."));
    const dataUri = await urlToDataUri(url, mimeTypeForFontExtension(extension));
    fontDataCache.set(`${variant.family}|${variant.weight}|${variant.style}`, dataUri);

    // Register the same bytes as a real FontFace so Canvas's measureText
    // (below) measures the actual embedded glyphs instead of a fallback.
    const fontFace = new FontFace(variant.family, `url(${dataUri})`, {
      weight: variant.weight,
      style: variant.style,
    });
    await fontFace.load();
    document.fonts.add(fontFace);
  });

  const rasterLoads = Object.entries(rasterUrlModules).map(async ([key, url]) => {
    const packageRootPath = toPackageRootPath(key);
    const extension = packageRootPath.slice(packageRootPath.lastIndexOf("."));
    const dataUri = await urlToDataUri(url, mimeTypeForExtension(extension));
    rasterDataCache.set(packageRootPath, dataUri);
  });

  await Promise.all([...fontLoads, ...rasterLoads]);
}

function resolveFontData(fontFamily: string, weight: FontWeight, style: FontStyle): string | undefined {
  return fontDataCache.get(`${fontFamily}|${weight}|${style}`);
}

function resolveRasterAsset(rasterAssetPath: string): string {
  const dataUri = rasterDataCache.get(rasterAssetPath);
  if (dataUri === undefined) {
    throw new Error(
      `No bundled raster asset for "${rasterAssetPath}" — keys are: ${[...rasterDataCache.keys()].join(", ")}`,
    );
  }
  return dataUri;
}

// Created lazily (not at module scope) so importing this module has no
// side effect if a render never actually happens; reused across every
// measureText call since a single 2D context is cheap to keep around.
let measureCtx: CanvasRenderingContext2D | undefined;

function measureCanvasText(text: string, fontSize: number, fontFamily: string, weight: FontWeight, style: FontStyle): number {
  // No embedded file for this exact variant (e.g. a literal CSS fallback
  // stack like "Georgia, serif") — fall back to the same guess toSvgString
  // itself uses, same reasoning as the Node side's measureText.ts.
  if (!findFontVariant(MTG_FONT_VARIANTS, fontFamily, weight, style)) return defaultMeasureText(text, fontSize);

  measureCtx ??= document.createElement("canvas").getContext("2d") ?? undefined;
  if (!measureCtx) return defaultMeasureText(text, fontSize); // no 2D context available — degrade rather than throw

  measureCtx.font = `${style === "italic" ? "italic " : ""}${weight === "bold" ? "bold " : ""}${fontSize}px "${fontFamily}"`;
  return measureCtx.measureText(text).width;
}

let cachedOptions: Promise<ToSvgOptions> | undefined;

/** Resolves once fonts/raster assets are loaded; safe to call repeatedly — later calls reuse the same load. */
export function getBrowserToSvgOptions(): Promise<ToSvgOptions> {
  if (!cachedOptions) {
    cachedOptions = loadAssetCaches().then(() => ({
      resolveSymbolSvg,
      resolveFontData,
      resolveRasterAsset,
      measureText: measureCanvasText,
    }));
  }
  return cachedOptions;
}
