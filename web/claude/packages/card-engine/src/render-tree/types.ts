import type { Card as MtgCard } from "../games/magic.js";
import type { Card as PlayingCardsCard } from "../games/playing-cards.js";

import type { AssetRef } from "../schema/types.js";

/** The values a user has entered for one card, scoped to a specific game. */
export type CardData =
  | { gameId: "mtg"; fields: MtgCard }
  | { gameId: "playing-cards"; fields: PlayingCardsCard };

// Per-game aliases, so a style file can name exactly the branch it accepts
// (e.g. `render(card: MtgCardData, ...)`) instead of the full union.
export type MtgCardData = Extract<CardData, { gameId: "mtg" }>;
export type PlayingCardsCardData = Extract<CardData, { gameId: "playing-cards" }>;

/**
 * Everything a style is allowed to know beyond the card's own fields.
 * Deliberately minimal: styles must not be able to reference other cards'
 * data, only a card's own position within its containing set (if any).
 */
export interface RenderContext {
  positionInSet?: number;
  setSize?: number;
}

/**
 * One run of inline content within a TextBox: either literal text or a
 * reference into the symbol registry (see ../symbols). Keeping these as a
 * flat, ordered list — rather than a plain string — is what lets a style mix
 * text and inline icons (e.g. mana symbols) within one field.
 */
export type TextRun = { kind: "text"; text: string } | { kind: "symbol"; symbolId: string };

export type HorizontalAlign = "left" | "center" | "right";
export type VerticalAlign = "top" | "middle" | "bottom";

interface BaseBox {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotationDeg?: number;
  /** Paint order among sibling boxes; higher draws on top. Default 0. */
  zIndex?: number;
}

export interface AutoFit {
  minSize: number;
  maxSize: number;
}

export interface TextBox extends BaseBox {
  kind: "text";
  content: TextRun[];
  fontFamily: string;
  /** Fixed font size in px. Mutually exclusive with autoFit. */
  fontSize?: number;
  /** Shrink-to-fit range in px — the renderer picks the largest size in range whose layout fits width x height. */
  autoFit?: AutoFit;
  color: string;
  align?: HorizontalAlign;
  verticalAlign?: VerticalAlign;
  italic?: boolean;
  bold?: boolean;
  /** Multiplier of font size. Defaults to a renderer-chosen value (~1.2) if omitted. */
  lineHeight?: number;
}

export interface ImageBox extends BaseBox {
  kind: "image";
  asset: AssetRef;
  fit?: "cover" | "contain" | "fill";
}

export interface ShapeBox extends BaseBox {
  kind: "shape";
  shape: "rect" | "ellipse";
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  /** "rect" only. */
  cornerRadius?: number;
}

export type RenderBox = TextBox | ImageBox | ShapeBox;

/**
 * The declarative output of a style's render() function: a set of
 * positioned boxes with fully-resolved values. Renderers (toSvgString now,
 * others later) consume this and never see CardData or style code directly —
 * that separation is what keeps the rendering backend swappable.
 */
export interface RenderTree {
  width: number;
  height: number;
  background?: { fill?: string };
  boxes: RenderBox[];
}
