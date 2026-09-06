import { describe, expect, it } from "vitest";
import { toSvgString } from "../../../render/toSvgString.js";
import type { RenderContext } from "../../../render-tree/types.js";
import type { CardData } from "../../../styles/types.js";
import { resolveSymbolSvgForTests } from "../../../testUtils/resolveSymbolSvg.js";
import { renderMtgClassic } from "./style.js";

const SAMPLE_CARD: CardData = {
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
const SAMPLE_CONTEXT: RenderContext = { positionInSet: 7, setSize: 249 };

describe("renderMtgClassic", () => {
  it("produces the expected set of boxes for a fully-populated card without art", () => {
    const tree = renderMtgClassic(SAMPLE_CARD, SAMPLE_CONTEXT);
    expect(tree.boxes.map((b) => b.id)).toEqual([
      "frame",
      "name",
      "mana-cost",
      "type-line",
      "rules-text",
      "flavor-text",
      "power-toughness",
      "set-number",
    ]);
  });

  it("adds the art box only when an art asset is set", () => {
    const withArt: CardData = {
      ...SAMPLE_CARD,
      fields: { ...SAMPLE_CARD.fields, art: { assetId: "a1" } },
    };
    const tree = renderMtgClassic(withArt, SAMPLE_CONTEXT);
    expect(tree.boxes.map((b) => b.id)).toContain("art");
  });

  it("omits power/toughness and set-number when unset", () => {
    const minimalCard: CardData = {
      gameId: "mtg",
      fields: { name: "Bare Card", types: ["Land"] },
    };
    const tree = renderMtgClassic(minimalCard, {});
    const ids = tree.boxes.map((b) => b.id);
    expect(ids).not.toContain("power-toughness");
    expect(ids).not.toContain("set-number");
    expect(ids).not.toContain("flavor-text");
  });

  it("resolves the mana cost field into inline symbol runs, not literal brace text", () => {
    const tree = renderMtgClassic(SAMPLE_CARD, SAMPLE_CONTEXT);
    const manaCostBox = tree.boxes.find((b) => b.id === "mana-cost");
    expect(manaCostBox?.kind).toBe("text");
    if (manaCostBox?.kind === "text") {
      expect(manaCostBox.content).toEqual([
        { kind: "symbol", symbolId: "mana-generic-1" },
        { kind: "symbol", symbolId: "mana-r" },
        { kind: "symbol", symbolId: "mana-r" },
      ]);
    }
  });

  it("matches its RenderTree snapshot for a canonical sample card", () => {
    expect(renderMtgClassic(SAMPLE_CARD, SAMPLE_CONTEXT)).toMatchSnapshot();
  });

  it("matches its serialized SVG snapshot for a canonical sample card (visual-regression net)", () => {
    const tree = renderMtgClassic(SAMPLE_CARD, SAMPLE_CONTEXT);
    // Unlike the tiny placeholder symbol SVGs, frame.png (and the real mtg
    // font files) are non-trivial binary assets — embedding their actual
    // base64 in a committed snapshot would be unreadable and huge for no
    // benefit, so both are stubbed here; the wiring (which path/family maps
    // to which box, and that a variant with no resolved data is left alone)
    // is what this snapshot is checking.
    const svg = toSvgString(tree, {
      resolveSymbolSvg: resolveSymbolSvgForTests,
      resolveRasterAsset: (path) => `data:image/png;base64,STUB(${path})`,
      resolveFontData: (family, weight, style) => `data:font/woff2;base64,STUB(${family}|${weight}|${style})`,
    });
    expect(svg).toMatchSnapshot();
  });
});
