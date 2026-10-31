import { describe, expect, it } from "vitest";
import { toSvgString } from "../../../render/toSvgString.js";
import type { RenderContext } from "../../../render-tree/types.js";
import type { SymbolMeta } from "../../../symbols/registry.ts";
import type { Card } from "../../../games/magic.js";
import { resolveSymbolSvgForTests } from "../../../testUtils/resolveSymbolSvg.js";
import { renderMtgHoloFoil } from "./style.js";

const SAMPLE_CARD: Card = {
  name: "Ember Hatchling",
  cost: "{1}{R}{R}",
  types: ["Creature", "Dragon"],
  rules: ["Flying.", "{T}: Deal 1 damage to any target."],
  power: "2",
  toughness: "2",
  flavor: "It hatched already breathing fire.",
};

const SAMPLE_SYMBOLS: SymbolMeta[] = [
  { id: "mana-generic-1", gameId: "mtg", displayName: "Generic 1", token: "1" },
  { id: "mana-r", gameId: "mtg", displayName: "Red", token: "R" },
  { id: "mana-tap", gameId: "mtg", displayName: "Tap", token: "T" },
];

const SAMPLE_CONTEXT: RenderContext = { positionInSet: 7, setSize: 249, gameSymbols: SAMPLE_SYMBOLS };

describe("renderMtgHoloFoil", () => {
  it("paints the foil background behind every other box", () => {
    const tree = renderMtgHoloFoil(SAMPLE_CARD, SAMPLE_CONTEXT);
    const background = tree.boxes.find((b) => b.id === "foil-background");
    expect(background?.kind).toBe("svgAsset");
    expect(tree.boxes.every((b) => (b.zIndex ?? 0) >= (background?.zIndex ?? 0))).toBe(true);
  });

  it("resolves the foil background asset path relative to the package root", () => {
    const tree = renderMtgHoloFoil(SAMPLE_CARD, SAMPLE_CONTEXT);
    const background = tree.boxes.find((b) => b.id === "foil-background");
    expect(background?.kind === "svgAsset" && background.svgAssetPath).toBe(
      "src/styles/mtg/holoFoil/background.svg",
    );
  });

  it("matches its serialized SVG snapshot for a canonical sample card (visual-regression net)", () => {
    const tree = renderMtgHoloFoil(SAMPLE_CARD, SAMPLE_CONTEXT);
    const svg = toSvgString(tree, {
      resolveSymbolSvg: resolveSymbolSvgForTests,
      resolveRasterAsset: (path) => `data:image/png;base64,STUB(${path})`,
    });
    expect(svg).toMatchSnapshot();
  });
});
