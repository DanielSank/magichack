import type { RenderBox, RenderContext, RenderTree } from "../../../render-tree/types.js";
import type { MtgCardData } from "../../../styles/types.js";
import { parseInlineSymbols } from "../../../symbols/parseInlineSymbols.js";

const CARD_WIDTH = 750;
const CARD_HEIGHT = 1050;
const MARGIN = 36;
const INK_COLOR = "#1a1408";
const MUTED_INK = "#4a3d22";
const TYPE_BAR_FILL = "#ded0ab";

/**
 * The one built-in style for the "mtg" game. Exercises the inline-symbol
 * pipeline via the mana cost field (and would via rules text symbols like
 * {T}, if present) — see plan M1.
 */
export function renderMtgClassic(card: MtgCardData, context: RenderContext): RenderTree {
  const fields = card.fields;
  const name = fields.name;
  const cost = fields.cost ?? "";
  const typeLine = fields.types.join(", ");
  const rulesText = (fields.rules ?? []).join("\n");
  const power = fields.power ?? "";
  const toughness = fields.toughness ?? "";
  const flavor = fields.flavor ?? "";
  const art = fields.art;

  const boxes: RenderBox[] = [
    {
      kind: "rasterAsset",
      id: "frame",
      rasterAssetPath: "src/styles/mtg/classic/frame.png",
      x: 0,
      y: 0,
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      fit: "cover",
      zIndex: 0,
    },
    {
      kind: "text",
      id: "name",
      x: MARGIN,
      y: MARGIN,
      width: CARD_WIDTH - MARGIN * 2 - 160,
      height: 56,
      content: [{ kind: "text", text: name }],
      fontFamily: "Beleren Bold",
      fontFit: 36,
      color: INK_COLOR,
      bold: true,
      verticalAlign: "middle",
      zIndex: 2,
    },
    {
      kind: "text",
      id: "mana-cost",
      x: CARD_WIDTH - MARGIN - 160,
      y: MARGIN,
      width: 160,
      height: 56,
      content: parseInlineSymbols(cost),
      fontFamily: "Georgia, serif",
      fontFit: 32,
      color: INK_COLOR,
      align: "right",
      verticalAlign: "middle",
      zIndex: 2,
    },
    {
      kind: "rect",
      id: "type-line-bg",
      x: MARGIN,
      y: MARGIN + 500,
      width: CARD_WIDTH - MARGIN * 2,
      height: 44,
      fill: TYPE_BAR_FILL,
      zIndex: 1,
    },
    {
      kind: "text",
      id: "type-line",
      x: MARGIN + 12,
      y: MARGIN + 500,
      width: CARD_WIDTH - MARGIN * 2 - 24,
      height: 44,
      content: [{ kind: "text", text: typeLine }],
      fontFamily: "Beleren Bold",
      fontFit: 24,
      color: INK_COLOR,
      bold: true,
      verticalAlign: "middle",
      zIndex: 2,
    },
    {
      kind: "text",
      id: "rules-text",
      x: MARGIN + 12,
      y: MARGIN + 556,
      width: CARD_WIDTH - MARGIN * 2 - 24,
      height: 260,
      content: parseInlineSymbols(rulesText),
      fontFamily: "MPlantin",
      color: INK_COLOR,
      fontFit: { minSize: 14, maxSize: 26 },
      verticalAlign: "top",
      zIndex: 2,
    },
  ];

  if (art) {
    boxes.push({
      kind: "image",
      id: "art",
      x: MARGIN,
      y: MARGIN + 70,
      width: CARD_WIDTH - MARGIN * 2,
      height: 420,
      asset: art,
      fit: "cover",
      zIndex: 1,
    });
  }

  if (flavor) {
    boxes.push({
      kind: "text",
      id: "flavor-text",
      x: MARGIN + 12,
      y: MARGIN + 556 + 210,
      width: CARD_WIDTH - MARGIN * 2 - 24,
      height: 70,
      content: [{ kind: "text", text: flavor }],
      fontFamily: "MPlantin",
      color: MUTED_INK,
      italic: true,
      fontFit: { minSize: 12, maxSize: 18 },
      zIndex: 2,
    });
  }

  if (power || toughness) {
    boxes.push({
      kind: "text",
      id: "power-toughness",
      x: CARD_WIDTH - MARGIN - 140,
      y: CARD_HEIGHT - MARGIN - 56,
      width: 120,
      height: 44,
      content: [{ kind: "text", text: `${power}/${toughness}` }],
      fontFamily: "Beleren Bold",
      fontFit: 28,
      color: INK_COLOR,
      bold: true,
      align: "right",
      verticalAlign: "middle",
      zIndex: 2,
    });
  }

  if (context.positionInSet !== undefined && context.setSize !== undefined) {
    boxes.push({
      kind: "text",
      id: "set-number",
      x: MARGIN,
      y: CARD_HEIGHT - MARGIN - 32,
      width: 160,
      height: 28,
      content: [{ kind: "text", text: `${context.positionInSet}/${context.setSize}` }],
      fontFamily: "MPlantin",
      fontFit: 16,
      color: MUTED_INK,
      zIndex: 2,
    });
  }

  return {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    background: { fill: "#f2e9d8" },
    boxes,
  };
}
