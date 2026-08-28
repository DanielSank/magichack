import { describe, expect, it } from "vitest";
import { toSvgString } from "../../render/toSvgString.js";
import type { CardData, RenderContext } from "../../render-tree/types.js";
import { resolveSymbolSvgForTests } from "../../testUtils/resolveSymbolSvg.js";
import { renderMtgClassic } from "./classic.js";

const SAMPLE_CARD: CardData = {
  gameId: "mtg",
  fields: {
    name: "Ember Hatchling",
    cost: "{1}{R}{R}",
    types: ["Creature", "Dragon"],
    rulesText: "Flying. {T}: Deal 1 damage to any target.",
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
      "type-line-bg",
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
    const svg = toSvgString(tree, { resolveSymbolSvg: resolveSymbolSvgForTests });
    expect(svg).toMatchSnapshot();
  });
});
