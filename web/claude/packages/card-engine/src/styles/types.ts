import type { Card as MtgCard } from "../games/magic.js";
import type { Card as PlayingCardsCard } from "../games/playing-cards.js";
import type { RenderContext, RenderTree } from "../render-tree/types.js";

export type CardData =
  | { gameId: "mtg"; fields: MtgCard }
  | { gameId: "playing-cards"; fields: PlayingCardsCard };

export type MtgCardData = Extract<CardData, { gameId: "mtg" }>;
export type PlayingCardsCardData = Extract<CardData, { gameId: "playing-cards" }>;

/**
 * A style is a pure function mapping a card and some additional contextual
 * information to a RenderTree. Renderers handle actual drawing.
 */
export type RenderFn<C extends CardData = CardData> = (card: C, context: RenderContext) => RenderTree;

export interface StyleDef<C extends CardData = CardData> {
  id: string;
  gameId: C["gameId"];
  displayName: string;
  render: RenderFn<C>;
}
