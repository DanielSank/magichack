/**
 * Dev tool for laying out a style: renders a card and overlays a coordinate
 * grid and/or each box's boundary on top of the real output, in the same
 * SVG-unit space `style.ts` files place boxes in. Lets you read x/y values
 * and see exactly where a box's edges fall against the actual current
 * render (frame, art, existing boxes and all) instead of eyeballing a flat
 * frame image in an external editor. Not part of the engine — pure
 * debugging aid, kept in scripts/ like renderDemo.ts.
 *
 * Run with `npm run demo:grid` from packages/card-engine. Edit STYLE_ID,
 * SHOW_GRID, and SHOW_BOX_OUTLINES below for whatever you're adjusting.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { selectStyle } from "../src/registry.js";
import { toSvgString } from "../src/render/toSvgString.js";
import type { RenderTree } from "../src/render-tree/types.js";
import type { CardData } from "../src/styles/types.js";
import { packageRoot, resolveFontData, resolveRasterAsset, resolveSymbolSvg } from "./lib/assetResolvers.js";
import { measureText } from "./lib/measureText.js";

const STYLE_ID = "mtg-classic";
const OUT_FILE = "mtg-classic-grid.local.svg";

const SHOW_GRID = true;
const GRID_SPACING = 50;
const LABEL_EVERY = 100; // draw a coordinate label on every Nth gridline

const SHOW_BOX_OUTLINES = true;
const OUTLINE_COLOR = "#0066ff"; // distinct from the grid's red, so the two never get confused

function buildGridOverlay(width: number, height: number): string {
  const parts: string[] = [];
  for (let x = 0; x <= width; x += GRID_SPACING) {
    const major = x % LABEL_EVERY === 0;
    parts.push(
      `<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="#ff0033" stroke-width="${major ? 1 : 0.5}" opacity="${major ? 0.6 : 0.3}"/>`,
    );
    if (major) parts.push(`<text x="${x + 2}" y="12" font-size="10" fill="#ff0033">${x}</text>`);
  }
  for (let y = 0; y <= height; y += GRID_SPACING) {
    const major = y % LABEL_EVERY === 0;
    parts.push(
      `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="#ff0033" stroke-width="${major ? 1 : 0.5}" opacity="${major ? 0.6 : 0.3}"/>`,
    );
    if (major) parts.push(`<text x="2" y="${y - 2}" font-size="10" fill="#ff0033">${y}</text>`);
  }
  return `<g>${parts.join("")}</g>`;
}

// Every RenderBox kind shares x/y/width/height/rotationDeg via BaseBox, so
// one outline routine covers all of them with no per-kind special-casing —
// same transform toSvgString itself applies for a rotated box, so a rotated
// box's outline lines up with its actual rendered content.
function buildBoxOutlinesOverlay(tree: RenderTree): string {
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

function renderWithGrid(styleId: string, cardData: CardData, outFile: string): void {
  const selected = selectStyle(cardData, styleId);
  if (!selected) {
    throw new Error(`No style registered with id "${styleId}" for game "${cardData.gameId}"`);
  }
  const tree = selected.style.render(selected.card, { positionInSet: 7, setSize: 249 });
  const svg = toSvgString(tree, { resolveSymbolSvg, resolveRasterAsset, resolveFontData, measureText });
  const overlay =
    (SHOW_GRID ? buildGridOverlay(tree.width, tree.height) : "") +
    (SHOW_BOX_OUTLINES ? buildBoxOutlinesOverlay(tree) : "");
  // Inline symbols (mana cost, {T} in rules text, ...) each emit their own
  // nested <svg>...</svg>, so a naive first-match replace would land the
  // overlay inside one of those tiny nested viewports instead of the outer
  // canvas. The outer closing tag is always the *last* one in the document.
  const closeTagIndex = svg.lastIndexOf("</svg>");
  const withOverlay = svg.slice(0, closeTagIndex) + overlay + svg.slice(closeTagIndex);
  const outPath = join(packageRoot, outFile);
  writeFileSync(outPath, withOverlay, "utf-8");
  console.log(`Wrote ${outPath}`);
}

// Same sample card as renderDemo.ts — swap in whatever fields are relevant
// to the boxes you're adjusting.
const sampleCard: CardData = {
  gameId: "mtg",
  fields: {
    name: "Ember Hatchling",
    cost: "{1}{R}{R}",
    types: ["Creature", "Dragon"],
    rules: ["Flying.", "{T}: Deal 1 damage to any target."],
    power: "2",
    toughness: "2",
    flavor: "It hatched already breathing fire.",
  },
};

renderWithGrid(STYLE_ID, sampleCard, OUT_FILE);
