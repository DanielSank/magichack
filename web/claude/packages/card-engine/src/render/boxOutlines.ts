import type { RenderTree } from "../render-tree/types.js";

const OUTLINE_COLOR = "#0066ff";

/**
 * Builds an SVG overlay showing every box's boundary and id — a style-
 * authoring aid and, in the editor, a click-to-edit affordance (shows the
 * user what's clickable). Every RenderBox shares x/y/width/height/
 * rotationDeg via BaseBox, so one routine covers all kinds with no per-kind
 * special-casing, and a rotated box's outline lines up with its actual
 * rendered content using the same transform toSvgString itself applies.
 */
export function buildBoxOutlinesOverlay(tree: RenderTree): string {
  const parts: string[] = [];
  for (const box of tree.boxes) {
    const transform = box.rotationDeg
      ? ` transform="rotate(${box.rotationDeg} ${box.x + box.width / 2} ${box.y + box.height / 2})"`
      : "";
    parts.push(
      `<rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="none" stroke="${OUTLINE_COLOR}" stroke-width="1" stroke-dasharray="4 3"${transform}/>`,
    );
    // Inside the top-left corner rather than above it, so a box flush
    // against an edge (e.g. the full-bleed frame at 0,0) still shows its label.
    parts.push(
      `<text x="${box.x + 3}" y="${box.y + 11}" font-size="9" fill="${OUTLINE_COLOR}"${transform}>${box.id}</text>`,
    );
  }
  return `<g>${parts.join("")}</g>`;
}

/**
 * Splices a box-outlines overlay into an already-serialized SVG string, just
 * before its closing tag. Inline symbols each emit their own nested
 * <svg>...</svg>, so a naive first-match replace would land the overlay
 * inside one of those tiny nested viewports instead of the outer canvas —
 * the outer closing tag is always the *last* one in the document.
 */
export function withBoxOutlinesOverlay(svg: string, tree: RenderTree): string {
  const overlay = buildBoxOutlinesOverlay(tree);
  const closeTagIndex = svg.lastIndexOf("</svg>");
  return svg.slice(0, closeTagIndex) + overlay + svg.slice(closeTagIndex);
}
