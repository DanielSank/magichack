import { describe, expect, it } from "vitest";
import type { EllipseBox, ImageBox, RectBox, RenderTree, TextBox } from "../render-tree/types.js";
import { toSvgString } from "./toSvgString.js";

const stubResolveSymbolSvg = (path: string) => `<svg viewBox="0 0 100 100"><!-- ${path} --></svg>`;

function treeWith(...boxes: RenderTree["boxes"]): RenderTree {
  return { width: 200, height: 300, boxes };
}

describe("toSvgString", () => {
  it("renders the outer svg with the tree's width/height and viewBox", () => {
    const svg = toSvgString(treeWith(), { resolveSymbolSvg: stubResolveSymbolSvg });
    expect(svg).toContain('viewBox="0 0 200 300"');
    expect(svg).toContain('width="200" height="300"');
  });

  it("renders a background fill as a full-bleed rect", () => {
    const svg = toSvgString(
      { width: 200, height: 300, background: { fill: "#ff0000" }, boxes: [] },
      { resolveSymbolSvg: stubResolveSymbolSvg },
    );
    expect(svg).toContain('<rect x="0" y="0" width="200" height="300" fill="#ff0000"/>');
  });

  it("renders a shape box (rect and ellipse)", () => {
    const rect: RectBox = {
      kind: "rect",
      id: "r",
      x: 10,
      y: 20,
      width: 30,
      height: 40,
      fill: "#123456",
      cornerRadius: 5,
    };
    const ellipse: EllipseBox = {
      kind: "ellipse",
      id: "e",
      x: 0,
      y: 0,
      width: 100,
      height: 50,
      stroke: "#000",
      strokeWidth: 2,
    };
    const svg = toSvgString(treeWith(rect, ellipse), { resolveSymbolSvg: stubResolveSymbolSvg });
    expect(svg).toContain('<rect x="10" y="20" width="30" height="40" rx="5" fill="#123456"/>');
    expect(svg).toContain('<ellipse cx="50" cy="25" rx="50" ry="25" fill="none" stroke="#000" stroke-width="2"/>');
  });

  it("renders an image box with preserveAspectRatio matching `fit`", () => {
    const box: ImageBox = {
      kind: "image",
      id: "art",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      asset: { assetId: "a1", url: "https://example.com/a.png" },
      fit: "contain",
    };
    const svg = toSvgString(treeWith(box), { resolveSymbolSvg: stubResolveSymbolSvg });
    expect(svg).toContain('href="https://example.com/a.png"');
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
  });

  it("renders single-line text left-aligned by default", () => {
    const box: TextBox = {
      kind: "text",
      id: "t",
      x: 10,
      y: 10,
      width: 180,
      height: 30,
      content: [{ kind: "text", text: "Hello" }],
      fontFamily: "sans-serif",
      fontFit: 16,
      color: "#000",
    };
    const svg = toSvgString(treeWith(box), { resolveSymbolSvg: stubResolveSymbolSvg });
    expect(svg).toContain('<text x="10"');
    expect(svg).toContain(">Hello</text>");
  });

  it("wraps text across multiple lines when it exceeds box width", () => {
    const box: TextBox = {
      kind: "text",
      id: "t",
      x: 0,
      y: 0,
      width: 40,
      height: 200,
      content: [{ kind: "text", text: "one two three four" }],
      fontFamily: "sans-serif",
      fontFit: 16,
      color: "#000",
    };
    // Fixed-width measurer so wrapping is deterministic: each word is wider
    // than the 40px box, forcing exactly one word per line.
    const svg = toSvgString(treeWith(box), {
      resolveSymbolSvg: stubResolveSymbolSvg,
      measureText: (text) => text.length * 20,
    });
    const lineCount = svg.match(/<text /g)?.length ?? 0;
    expect(lineCount).toBe(4);
  });

  it("falls back to autoFit's minSize when no size in range fits the box height", () => {
    const box: TextBox = {
      kind: "text",
      id: "t",
      x: 0,
      y: 0,
      width: 500,
      // Too short for even one line at minSize (8px * 1.2 line height = 9.6px),
      // so every candidate size is rejected and pickAutoFitSize falls back to minSize.
      height: 1,
      content: [{ kind: "text", text: "Some rules text" }],
      fontFamily: "sans-serif",
      color: "#000",
      fontFit: { minSize: 8, maxSize: 40 },
    };
    const svg = toSvgString(treeWith(box), { resolveSymbolSvg: stubResolveSymbolSvg });
    expect(svg).toContain('font-size="8"');
  });

  it("picks a size strictly between min and max when only an intermediate size fits", () => {
    const box: TextBox = {
      kind: "text",
      id: "t",
      x: 0,
      y: 0,
      width: 90,
      height: 15,
      content: [{ kind: "text", text: "Some rules text" }],
      fontFamily: "sans-serif",
      color: "#000",
      fontFit: { minSize: 6, maxSize: 20 },
    };
    const svg = toSvgString(treeWith(box), {
      resolveSymbolSvg: stubResolveSymbolSvg,
      measureText: (text, fontSize) => text.length * fontSize,
    });
    const [, chosenSize] = svg.match(/font-size="(\d+)"/) ?? [];
    expect(Number(chosenSize)).toBeGreaterThanOrEqual(6);
    expect(Number(chosenSize)).toBeLessThan(20);
  });

  it("inlines a registered symbol's SVG markup as a nested <svg>", () => {
    const box: TextBox = {
      kind: "text",
      id: "t",
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      content: [{ kind: "symbol", symbolId: "mana-w" }],
      fontFamily: "sans-serif",
      fontFit: 24,
      color: "#000",
    };
    const svg = toSvgString(treeWith(box), { resolveSymbolSvg: stubResolveSymbolSvg });
    expect(svg).toContain("assets/symbols/mana-w.svg");
    expect(svg).toContain('width="24" height="24"');
  });

  it("falls back to literal brace text for an unregistered symbol id", () => {
    const box: TextBox = {
      kind: "text",
      id: "t",
      x: 0,
      y: 0,
      width: 100,
      height: 40,
      content: [{ kind: "symbol", symbolId: "not-a-real-symbol" }],
      fontFamily: "sans-serif",
      fontFit: 24,
      color: "#000",
    };
    const svg = toSvgString(treeWith(box), { resolveSymbolSvg: stubResolveSymbolSvg });
    expect(svg).toContain(">{not-a-real-symbol}</text>");
  });

  it("paints lower zIndex boxes before higher zIndex boxes", () => {
    const back: RectBox = {
      kind: "rect",
      id: "back",
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      fill: "#111111",
      zIndex: 0,
    };
    const front: RectBox = {
      kind: "rect",
      id: "front",
      x: 0,
      y: 0,
      width: 10,
      height: 10,
      fill: "#222222",
      zIndex: 5,
    };
    // Pass in reverse order to prove sorting, not input order, decides paint order.
    const svg = toSvgString(treeWith(front, back), { resolveSymbolSvg: stubResolveSymbolSvg });
    expect(svg.indexOf("#111111")).toBeLessThan(svg.indexOf("#222222"));
  });
});
