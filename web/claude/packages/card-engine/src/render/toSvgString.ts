import type {
  AutoFit,
  EllipseBox,
  HorizontalAlign,
  ImageBox,
  RasterAssetBox,
  RectBox,
  RenderBox,
  RenderTree,
  SvgAssetBox,
  TextBox,
  TextRun,
  VerticalAlign,
} from "../render-tree/types.js";
import { findSymbol } from "../symbols/registry.js";

/**
 * Turns a RenderTree into a standalone SVG string.
 *
 * card-engine stays DOM/browser-free by design, so this file has no access
 * to real font metrics (no canvas measureText) or file I/O — both are
 * injected via `options` so each environment (a future browser preview, a
 * Node demo/export script, a render service) can supply what it has:
 *  - `measureText` estimates a text run's width; defaults to a rough
 *    average-glyph-width model, good enough for layout but not pixel-exact.
 *  - `resolveSymbolSvg` returns the raw SVG markup for a symbol asset path,
 *    so it can be inlined directly into the output (no external references
 *    to resolve later, which matters for portable/embeddable export).
 *  - `resolveRasterAsset` is the same idea for RasterAssetBox: given an
 *    asset path, it returns a ready-to-embed `data:` URI (the edge owns
 *    reading the file and base64/mime-type-encoding it). Optional, since
 *    most trees never use one; a tree that does but omits it throws.
 *  - `resolveFontData` covers TextBox's `fontFamily`. This output is a
 *    standalone SVG string with no surrounding page to inherit fonts from
 *    (unlike an inline <svg> living in a browser-rendered page), so a
 *    font-family the viewer doesn't already have installed will otherwise
 *    silently fall back to some default face. When given, it's called once
 *    per distinct (family, weight, style) the tree actually uses and, if it
 *    returns a `data:` URI, that variant is embedded as a `@font-face` in a
 *    <style> block up top — same "no external references to resolve later"
 *    reasoning as the asset resolvers above. Optional, and per-variant: a
 *    family/weight/style it doesn't recognize (or the option being omitted
 *    entirely) just leaves that box's `font-family` as a literal CSS value,
 *    same as today.
 *
 * The interesting part is text+symbol flow: SVG's native <text>/<tspan>
 * layout has no notion of an inline <image>, so mixed text/symbol content
 * (e.g. a mana cost, or rules text with a tap symbol) is wrapped and
 * positioned manually here rather than delegated to the renderer's text
 * engine. Each symbol run is treated as a fixed-width unit (one "em square"
 * at the surrounding font size) during line-wrapping.
 */
export type FontWeight = "normal" | "bold";
export type FontStyle = "normal" | "italic";

export interface ToSvgOptions {
  measureText?: (text: string, fontSize: number, fontFamily: string, weight: FontWeight, style: FontStyle) => number;
  resolveSymbolSvg: (svgAssetPath: string) => string;
  resolveRasterAsset?: (rasterAssetPath: string) => string;
  resolveFontData?: (fontFamily: string, weight: FontWeight, style: FontStyle) => string | undefined;
}

const DEFAULT_LINE_HEIGHT = 1.2;
// Deliberately generous: absent real glyph metrics, underestimating width
// causes words to visually crowd or overlap (worse than a slightly loose
// gap). Tuned against a serif fallback font with no Georgia installed —
// revisit if this is measurably off against your target font(s).
const AVG_CHAR_WIDTH_EM = 0.62;
// A space is much narrower than the average glyph AVG_CHAR_WIDTH_EM is tuned
// for — reusing that constant for spaceWidth (wrapTokens/renderTextBox both
// measure a lone " ") made every inter-word gap render about 2x too wide.
const AVG_SPACE_WIDTH_EM = 0.28;

// Exported so an environment with better metrics available (e.g. the demo
// scripts' real per-glyph measurement, see scripts/lib/measureText.ts) can
// fall back to this same guess for a family it has no real data for,
// instead of duplicating this heuristic a second time.
export function defaultMeasureText(text: string, fontSize: number): number {
  if (/^\s+$/.test(text)) return text.length * fontSize * AVG_SPACE_WIDTH_EM;
  return text.length * fontSize * AVG_CHAR_WIDTH_EM;
}

export function toSvgString(tree: RenderTree, options: ToSvgOptions): string {
  const measureText = options.measureText ?? defaultMeasureText;
  const boxes = [...tree.boxes].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${tree.width} ${tree.height}" width="${tree.width}" height="${tree.height}">`,
  ];
  if (options.resolveFontData) {
    const fontFaceStyle = buildFontFaceStyle(collectFontVariants(boxes), options.resolveFontData);
    if (fontFaceStyle) parts.push(fontFaceStyle);
  }
  if (tree.background?.fill) {
    parts.push(
      `<rect x="0" y="0" width="${tree.width}" height="${tree.height}" fill="${escapeAttr(tree.background.fill)}"/>`,
    );
  }
  for (const box of boxes) {
    parts.push(renderBox(box, measureText, options.resolveSymbolSvg, options.resolveRasterAsset));
  }
  parts.push("</svg>");
  return parts.join("\n");
}

function renderBox(
  box: RenderBox,
  measureText: (text: string, fontSize: number, fontFamily: string, weight: FontWeight, style: FontStyle) => number,
  resolveSymbolSvg: (path: string) => string,
  resolveRasterAsset: ((path: string) => string) | undefined,
): string {
  const transform = box.rotationDeg
    ? ` transform="rotate(${box.rotationDeg} ${box.x + box.width / 2} ${box.y + box.height / 2})"`
    : "";
  switch (box.kind) {
    case "rect":
      return renderRectBox(box, transform);
    case "ellipse":
      return renderEllipseBox(box, transform);
    case "image":
      return renderImageBox(box, transform);
    case "text":
      return renderTextBox(box, measureText, resolveSymbolSvg, transform);
    case "svgAsset":
      return renderSvgAssetBox(box, resolveSymbolSvg, transform);
    case "rasterAsset":
      return renderRasterAssetBox(box, resolveRasterAsset, transform);
  }
}

function renderSvgAssetBox(box: SvgAssetBox, resolveSymbolSvg: (path: string) => string, transform: string): string {
  const inner = stripOuterSvgTag(resolveSymbolSvg(box.svgAssetPath));
  return `<svg x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" viewBox="0 0 100 100" preserveAspectRatio="none"${transform}>${inner}</svg>`;
}

function renderRectBox(box: RectBox, transform: string): string {
  const fill = box.fill ? ` fill="${escapeAttr(box.fill)}"` : ' fill="none"';
  const stroke = box.stroke
    ? ` stroke="${escapeAttr(box.stroke)}" stroke-width="${box.strokeWidth ?? 1}"`
    : "";
  const rxAttr = box.cornerRadius ? ` rx="${box.cornerRadius}"` : "";
  return `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}"${rxAttr}${fill}${stroke}${transform}/>`;
}

function renderEllipseBox(box: EllipseBox, transform: string): string {
  const fill = box.fill ? ` fill="${escapeAttr(box.fill)}"` : ' fill="none"';
  const stroke = box.stroke
    ? ` stroke="${escapeAttr(box.stroke)}" stroke-width="${box.strokeWidth ?? 1}"`
    : "";
  const rx = box.width / 2;
  const ry = box.height / 2;
  return `<ellipse cx="${box.x + rx}" cy="${box.y + ry}" rx="${rx}" ry="${ry}"${fill}${stroke}${transform}/>`;
}

function renderImageBox(box: ImageBox, transform: string): string {
  const href = box.asset.url ?? "";
  return `<image x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" href="${escapeAttr(href)}" preserveAspectRatio="${preserveAspectRatioFor(box.fit)}"${transform}/>`;
}

function renderRasterAssetBox(
  box: RasterAssetBox,
  resolveRasterAsset: ((path: string) => string) | undefined,
  transform: string,
): string {
  if (!resolveRasterAsset) {
    throw new Error(
      `RenderTree has a rasterAsset box ("${box.id}") but no resolveRasterAsset was given in ToSvgOptions.`,
    );
  }
  const href = resolveRasterAsset(box.rasterAssetPath);
  return `<image x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" href="${escapeAttr(href)}" preserveAspectRatio="${preserveAspectRatioFor(box.fit)}"${transform}/>`;
}

// Shared by ImageBox and RasterAssetBox — both are SVG <image> elements with
// the same `fit` vocabulary; only where the href comes from differs.
function preserveAspectRatioFor(fit: "cover" | "contain" | "fill" | undefined): string {
  return fit === "contain" ? "xMidYMid meet" : fit === "fill" ? "none" : "xMidYMid slice";
}

// --- Font embedding --------------------------------------------------------

interface FontVariantKey {
  family: string;
  weight: FontWeight;
  style: FontStyle;
}

// A TextBox's bold/italic are booleans, not arbitrary CSS weights/styles, so
// there are at most 4 variants per font-family actually reachable — collect
// only the ones this tree uses rather than asking the resolver about every
// combination up front.
function collectFontVariants(boxes: RenderBox[]): FontVariantKey[] {
  const seen = new Set<string>();
  const variants: FontVariantKey[] = [];
  for (const box of boxes) {
    if (box.kind !== "text") continue;
    const weight: FontWeight = box.bold ? "bold" : "normal";
    const style: FontStyle = box.italic ? "italic" : "normal";
    const key = `${box.fontFamily} ${weight} ${style}`;
    if (seen.has(key)) continue;
    seen.add(key);
    variants.push({ family: box.fontFamily, weight, style });
  }
  return variants;
}

function buildFontFaceStyle(
  variants: FontVariantKey[],
  resolveFontData: (fontFamily: string, weight: FontWeight, style: FontStyle) => string | undefined,
): string {
  const rules: string[] = [];
  for (const { family, weight, style } of variants) {
    const dataUri = resolveFontData(family, weight, style);
    // No embedded data for this variant: leave it as a literal font-family
    // string on the box (unchanged today), rather than emitting a bogus rule.
    if (!dataUri) continue;
    const familyLiteral = escapeText(family.replace(/\\/g, "\\\\").replace(/"/g, '\\"'));
    rules.push(`@font-face{font-family:"${familyLiteral}";font-weight:${weight};font-style:${style};src:url(${dataUri});}`);
  }
  return rules.length > 0 ? `<style>${rules.join("")}</style>` : "";
}

// --- Text + inline symbol flow -------------------------------------------

interface RawToken {
  kind: "text" | "symbol" | "break";
  text?: string;
  symbolId?: string;
  trailingSpace: boolean;
}

interface LayoutToken extends RawToken {
  width: number;
}

function tokenize(content: TextRun[]): RawToken[] {
  const tokens: RawToken[] = [];
  for (const run of content) {
    if (run.kind === "symbol") {
      tokens.push({ kind: "symbol", symbolId: run.symbolId, trailingSpace: false });
      continue;
    }
    for (const piece of run.text.split(/(\s+)/)) {
      if (piece === "") continue;
      if (/^\s+$/.test(piece)) {
        // A run of whitespace containing a real newline is an explicit hard
        // break (e.g. joined rules-text lines), not a word-wrap point — one
        // "break" token per newline, so "a\n\nb" still leaves a blank line.
        // Plain spaces/tabs stay a soft gap, handled by wrapTokens' wrapping.
        const newlineCount = piece.split("\n").length - 1;
        if (newlineCount > 0) {
          for (let i = 0; i < newlineCount; i++) {
            tokens.push({ kind: "break", trailingSpace: false });
          }
          continue;
        }
        const prev = tokens[tokens.length - 1];
        if (prev) prev.trailingSpace = true;
        continue;
      }
      tokens.push({ kind: "text", text: piece, trailingSpace: false });
    }
  }
  return tokens;
}

function wrapTokens(
  tokens: RawToken[],
  maxWidth: number,
  fontSize: number,
  fontFamily: string,
  weight: FontWeight,
  style: FontStyle,
  measureText: (text: string, fontSize: number, fontFamily: string, weight: FontWeight, style: FontStyle) => number,
): LayoutToken[][] {
  // No content at all should mean zero lines (an empty text box takes no
  // vertical space) — handled here rather than by filtering empty lines
  // below, which would also wrongly swallow a genuine blank line that a
  // doubled "\n\n" break is deliberately asking for.
  if (tokens.length === 0) return [];

  const spaceWidth = measureText(" ", fontSize, fontFamily, weight, style);
  const lines: LayoutToken[][] = [];
  let currentLine: LayoutToken[] = [];
  let currentWidth = 0;

  const pushLine = () => {
    const last = currentLine[currentLine.length - 1];
    if (last) last.trailingSpace = false;
    lines.push(currentLine);
    currentLine = [];
    currentWidth = 0;
  };

  for (const token of tokens) {
    if (token.kind === "break") {
      pushLine();
      continue;
    }
    const width = token.kind === "symbol" ? fontSize : measureText(token.text ?? "", fontSize, fontFamily, weight, style);
    const prefixSpace = currentLine.length > 0 ? spaceWidth : 0;

    // Force at least one token per line even if it alone exceeds maxWidth,
    // so an oversized single word/symbol can't loop forever.
    if (currentLine.length > 0 && currentWidth + prefixSpace + width > maxWidth) {
      pushLine();
    }

    currentLine.push({ ...token, width });
    currentWidth += (currentLine.length > 1 ? spaceWidth : 0) + width;
  }
  pushLine();

  return lines;
}

function pickAutoFitSize(
  tokens: RawToken[],
  box: TextBox,
  autoFit: AutoFit,
  weight: FontWeight,
  style: FontStyle,
  measureText: (text: string, fontSize: number, fontFamily: string, weight: FontWeight, style: FontStyle) => number,
  lineHeightMultiplier: number,
): number {
  const { minSize, maxSize } = autoFit;
  for (let size = maxSize; size >= minSize; size -= 1) {
    const lines = wrapTokens(tokens, box.width, size, box.fontFamily, weight, style, measureText);
    const blockHeight = lines.length * size * lineHeightMultiplier;
    if (blockHeight <= box.height) return size;
  }
  return minSize;
}

function verticalOffset(align: VerticalAlign | undefined, boxHeight: number, blockHeight: number): number {
  if (align === "middle") return (boxHeight - blockHeight) / 2;
  if (align === "bottom") return boxHeight - blockHeight;
  return 0;
}

function horizontalOffset(align: HorizontalAlign | undefined, boxWidth: number, lineWidth: number): number {
  if (align === "center") return (boxWidth - lineWidth) / 2;
  if (align === "right") return boxWidth - lineWidth;
  return 0;
}

function renderTextBox(
  box: TextBox,
  measureText: (text: string, fontSize: number, fontFamily: string, weight: FontWeight, style: FontStyle) => number,
  resolveSymbolSvg: (path: string) => string,
  transform: string,
): string {
  const lineHeightMultiplier = box.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const tokens = tokenize(box.content);
  const weight: FontWeight = box.bold ? "bold" : "normal";
  const style: FontStyle = box.italic ? "italic" : "normal";

  const fontFit = typeof box.fontFit === "number"
    ? box.fontFit
    : pickAutoFitSize(tokens, box, box.fontFit, weight, style, measureText, lineHeightMultiplier);

  const lines = wrapTokens(tokens, box.width, fontFit, box.fontFamily, weight, style, measureText);
  const lineHeight = fontFit * lineHeightMultiplier;
  const blockHeight = lines.length * lineHeight;
  // 0.85 approximates cap-height-to-baseline distance for a font size, absent real metrics.
  const startY = box.y + verticalOffset(box.verticalAlign, box.height, blockHeight) + fontFit * 0.85;
  const spaceWidth = measureText(" ", fontFit, box.fontFamily, weight, style);

  const g: string[] = [`<g${transform}>`];
  lines.forEach((line, i) => {
    const lineWidth = line.reduce((sum, t) => sum + t.width + (t.trailingSpace ? spaceWidth : 0), 0);
    let cursorX = box.x + horizontalOffset(box.align, box.width, lineWidth);
    const y = startY + i * lineHeight;

    for (const token of line) {
      if (token.kind === "text") {
        g.push(
          `<text x="${cursorX}" y="${y}" font-family="${escapeAttr(box.fontFamily)}" font-size="${fontFit}" fill="${escapeAttr(box.color)}"${box.italic ? ' font-style="italic"' : ""}${box.bold ? ' font-weight="bold"' : ""}>${escapeText(token.text ?? "")}</text>`,
        );
      } else {
        const symbol = token.symbolId ? findSymbol(token.symbolId) : undefined;
        if (symbol) {
          const inner = stripOuterSvgTag(resolveSymbolSvg(symbol.svgAssetPath));
          const symbolY = y - fontFit * 0.8; // roughly aligns the icon's top with the text's cap height
          g.push(
            `<svg x="${cursorX}" y="${symbolY}" width="${fontFit}" height="${fontFit}" viewBox="0 0 100 100">${inner}</svg>`,
          );
        } else {
          // Unregistered symbol id: degrade to a visible placeholder rather than silently dropping content.
          g.push(
            `<text x="${cursorX}" y="${y}" font-family="${escapeAttr(box.fontFamily)}" font-size="${fontFit}" fill="${escapeAttr(box.color)}">{${escapeText(token.symbolId ?? "?")}}</text>`,
          );
        }
      }
      cursorX += token.width + (token.trailingSpace ? spaceWidth : 0);
    }
  });
  g.push("</g>");
  return g.join("\n");
}

function stripOuterSvgTag(svgSource: string): string {
  const match = svgSource.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  return match ? (match[1] ?? "") : svgSource;
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeText(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
