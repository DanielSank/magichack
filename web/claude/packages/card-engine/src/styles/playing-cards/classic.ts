import type {
  PlayingCardsCardData,
  RenderBox,
  RenderContext,
  RenderTree,
  TextRun,
} from "../../render-tree/types.js";
import { pipLayoutForRank } from "../shared/pipLayout.js";

const CARD_WIDTH = 750;
const CARD_HEIGHT = 1050;
const MARGIN = 36;
const PIP_SIZE = 84;
const CORNER_PIP_SIZE = 48;

const RED_SUITS = new Set(["hearts", "diamonds"]);

function suitSymbolId(suit: string): string {
  return `suit-${suit}`;
}

function suitColor(suit: string): string {
  return RED_SUITS.has(suit) ? "#c0392b" : "#1a1a1a";
}

function symbolRun(symbolId: string): TextRun[] {
  return [{ kind: "symbol", symbolId }];
}

/**
 * The one built-in style for the "playing-cards" game — the simplest
 * supported game, kept deliberately plain to prove the engine isn't
 * MTG-specific. Reuses a TextBox with a single symbol run (rather than a
 * dedicated image box) to place standalone suit icons: corner indices and,
 * for numeric ranks, the pip grid computed by the shared pipLayout helper.
 */
export function renderPlayingCardClassic(card: PlayingCardsCardData, _context: RenderContext): RenderTree {
  const suit = card.fields.suit;
  const rank = card.fields.rank;
  const art = card.fields.art;
  const color = suitColor(suit);
  const symbolId = suitSymbolId(suit);

  const boxes: RenderBox[] = [
    {
      kind: "shape",
      id: "frame",
      shape: "rect",
      x: MARGIN / 2,
      y: MARGIN / 2,
      width: CARD_WIDTH - MARGIN,
      height: CARD_HEIGHT - MARGIN,
      stroke: "#333333",
      strokeWidth: 3,
      cornerRadius: 28,
      zIndex: 0,
    },
    // Top-left corner index.
    {
      kind: "text",
      id: "corner-tl-rank",
      x: MARGIN + 8,
      y: MARGIN + 8,
      width: 60,
      height: 44,
      content: [{ kind: "text", text: rank }],
      fontFamily: "Georgia, serif",
      fontSize: 36,
      color,
      bold: true,
      align: "left",
      zIndex: 2,
    },
    {
      kind: "text",
      id: "corner-tl-suit",
      x: MARGIN + 8,
      y: MARGIN + 52,
      width: CORNER_PIP_SIZE,
      height: CORNER_PIP_SIZE,
      content: symbolRun(symbolId),
      fontFamily: "sans-serif",
      fontSize: CORNER_PIP_SIZE,
      color,
      zIndex: 2,
    },
    // Bottom-right corner index — mirrored so it reads correctly when the card is turned around.
    {
      kind: "text",
      id: "corner-br-rank",
      x: CARD_WIDTH - MARGIN - 8 - 60,
      y: CARD_HEIGHT - MARGIN - 8 - 44,
      width: 60,
      height: 44,
      content: [{ kind: "text", text: rank }],
      fontFamily: "Georgia, serif",
      fontSize: 36,
      color,
      bold: true,
      align: "right",
      rotationDeg: 180,
      zIndex: 2,
    },
    {
      kind: "text",
      id: "corner-br-suit",
      x: CARD_WIDTH - MARGIN - 8 - CORNER_PIP_SIZE,
      y: CARD_HEIGHT - MARGIN - 52 - CORNER_PIP_SIZE,
      width: CORNER_PIP_SIZE,
      height: CORNER_PIP_SIZE,
      content: symbolRun(symbolId),
      fontFamily: "sans-serif",
      fontSize: CORNER_PIP_SIZE,
      color,
      rotationDeg: 180,
      zIndex: 2,
    },
  ];

  if (art) {
    // Per game-schemas/playing-cards.yaml: custom art replaces the default pip layout.
    boxes.push({
      kind: "image",
      id: "art",
      x: MARGIN + 90,
      y: MARGIN + 90,
      width: CARD_WIDTH - (MARGIN + 90) * 2,
      height: CARD_HEIGHT - (MARGIN + 90) * 2,
      asset: art,
      fit: "cover",
      zIndex: 1,
    });
  } else {
    const pips = pipLayoutForRank(rank);
    if (pips.length > 0) {
      pips.forEach((pip, i) => {
        boxes.push({
          kind: "text",
          id: `pip-${i}`,
          x: pip.x * CARD_WIDTH - PIP_SIZE / 2,
          y: pip.y * CARD_HEIGHT - PIP_SIZE / 2,
          width: PIP_SIZE,
          height: PIP_SIZE,
          content: symbolRun(symbolId),
          fontFamily: "sans-serif",
          fontSize: PIP_SIZE,
          color,
          rotationDeg: pip.flipped ? 180 : undefined,
          zIndex: 2,
        });
      });
    } else {
      // Face card (J/Q/K): a large suit symbol plus the rank letter; no illustrated face yet.
      boxes.push({
        kind: "text",
        id: "face-suit",
        x: CARD_WIDTH / 2 - 120,
        y: CARD_HEIGHT / 2 - 150,
        width: 240,
        height: 240,
        content: symbolRun(symbolId),
        fontFamily: "sans-serif",
        fontSize: 240,
        color,
        zIndex: 2,
      });
      boxes.push({
        kind: "text",
        id: "face-rank",
        x: CARD_WIDTH / 2 - 90,
        y: CARD_HEIGHT / 2 + 110,
        width: 180,
        height: 140,
        content: [{ kind: "text", text: rank }],
        fontFamily: "Georgia, serif",
        fontSize: 120,
        color,
        bold: true,
        align: "center",
        verticalAlign: "middle",
        zIndex: 2,
      });
    }
  }

  return {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    background: { fill: "#fdfaf3" },
    boxes,
  };
}
