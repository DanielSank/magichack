import { describe, expect, it } from "vitest";
import { toSvgString } from "../../../render/toSvgString.js";
import type { CardData } from "../../../render-tree/types.js";
import { resolveSymbolSvgForTests } from "../../../testUtils/resolveSymbolSvg.js";
import { renderPlayingCardClassic } from "./style.js";

const SEVEN_OF_HEARTS: CardData = { gameId: "playing-cards", fields: { suit: "hearts", rank: "7" } };
const QUEEN_OF_SPADES: CardData = { gameId: "playing-cards", fields: { suit: "spades", rank: "Q" } };

describe("renderPlayingCardClassic", () => {
  it("lays out one pip per instance of the rank's pip count", () => {
    const tree = renderPlayingCardClassic(SEVEN_OF_HEARTS, {});
    const pipIds = tree.boxes.map((b) => b.id).filter((id) => id.startsWith("pip-"));
    expect(pipIds).toHaveLength(7);
  });

  it("renders a face card with a large glyph instead of a pip grid", () => {
    const tree = renderPlayingCardClassic(QUEEN_OF_SPADES, {});
    const ids = tree.boxes.map((b) => b.id);
    expect(ids).toContain("face-suit");
    expect(ids).toContain("face-rank");
    expect(ids.some((id) => id.startsWith("pip-"))).toBe(false);
  });

  it("uses the red palette for hearts/diamonds and black for clubs/spades", () => {
    const heartsTree = renderPlayingCardClassic(SEVEN_OF_HEARTS, {});
    const spadesTree = renderPlayingCardClassic(QUEEN_OF_SPADES, {});
    const heartsRank = heartsTree.boxes.find((b) => b.id === "corner-tl-rank");
    const spadesRank = spadesTree.boxes.find((b) => b.id === "corner-tl-rank");
    expect(heartsRank?.kind === "text" && heartsRank.color).toBe("#c0392b");
    expect(spadesRank?.kind === "text" && spadesRank.color).toBe("#1a1a1a");
  });

  it("replaces the pip grid with an art box when custom art is provided", () => {
    const withArt: CardData = { ...SEVEN_OF_HEARTS, fields: { ...SEVEN_OF_HEARTS.fields, art: { assetId: "a1" } } };
    const tree = renderPlayingCardClassic(withArt, {});
    const ids = tree.boxes.map((b) => b.id);
    expect(ids).toContain("art");
    expect(ids.some((id) => id.startsWith("pip-"))).toBe(false);
  });

  it("mirrors the bottom-right corner index with a 180° rotation", () => {
    const tree = renderPlayingCardClassic(SEVEN_OF_HEARTS, {});
    const brRank = tree.boxes.find((b) => b.id === "corner-br-rank");
    expect(brRank?.rotationDeg).toBe(180);
  });

  it("matches its serialized SVG snapshot for canonical sample cards (visual-regression net)", () => {
    for (const [name, card] of [
      ["seven-of-hearts", SEVEN_OF_HEARTS],
      ["queen-of-spades", QUEEN_OF_SPADES],
    ] as const) {
      const svg = toSvgString(renderPlayingCardClassic(card, {}), {
        resolveSymbolSvg: resolveSymbolSvgForTests,
      });
      expect(svg).toMatchSnapshot(name);
    }
  });
});
