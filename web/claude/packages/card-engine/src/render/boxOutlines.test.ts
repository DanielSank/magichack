import { describe, expect, it } from "vitest";
import type { RectBox, RenderTree } from "../render-tree/types.js";
import { buildBoxOutlinesOverlay, withBoxOutlinesOverlay } from "./boxOutlines.js";

function rect(overrides: Partial<RectBox> = {}): RectBox {
  return { kind: "rect", id: "box-a", x: 10, y: 20, width: 100, height: 50, ...overrides };
}

describe("buildBoxOutlinesOverlay", () => {
  it("draws one dashed rect and one id label per box", () => {
    const tree: RenderTree = { width: 750, height: 1050, boxes: [rect()] };
    const overlay = buildBoxOutlinesOverlay(tree);
    expect(overlay).toContain('<rect x="10" y="20" width="100" height="50" fill="none" stroke="#0066ff" stroke-width="1" stroke-dasharray="4 3"/>');
    expect(overlay).toContain(">box-a</text>");
  });

  it("applies the same rotation transform a rotated box would render with", () => {
    const tree: RenderTree = { width: 750, height: 1050, boxes: [rect({ rotationDeg: 180 })] };
    const overlay = buildBoxOutlinesOverlay(tree);
    expect(overlay).toContain('transform="rotate(180 60 45)"');
  });

  it("returns an empty group for a tree with no boxes", () => {
    const tree: RenderTree = { width: 750, height: 1050, boxes: [] };
    expect(buildBoxOutlinesOverlay(tree)).toBe("<g></g>");
  });
});

describe("withBoxOutlinesOverlay", () => {
  it("splices the overlay in just before the outer closing </svg> tag", () => {
    const tree: RenderTree = { width: 750, height: 1050, boxes: [rect()] };
    const svg = '<svg><g><svg viewBox="0 0 10 10"></svg></g></svg>';
    const result = withBoxOutlinesOverlay(svg, tree);
    const outerClose = result.lastIndexOf("</svg>");
    expect(result.slice(0, outerClose)).toContain("box-a");
    expect(result.indexOf("box-a")).toBeGreaterThan(svg.indexOf('<svg viewBox="0 0 10 10">'));
  });
});
