import type { GameId, CardMap } from "../games/types.js";
import type { RenderContext, RenderTree } from "../render-tree/types.js";

//export type CardData<G extends GameId = GameId> = {
//  [P in G]: { gameId: P; fields: CardMap[P] };
//}[G];
//
//export type MtgCardData = Extract<CardData, { gameId: "mtg" }>;
//export type PlayingCardsCardData = Extract<CardData, { gameId: "playing-cards" }>;

/**
 * A style is a pure function mapping a card and some additional contextual
 * information to a RenderTree. Renderers handle actual drawing.
 */
export type RenderFn<G extends GameId = GameId> = (card: CardMap[G], context: RenderContext) => RenderTree;

export interface StyleDef<G extends GameId = GameId> {
  id: string;
  gameId: G
  displayName: string;
  render: RenderFn<G>;
}

export type StyleRegistry = { [G in GameId]: StyleDef<G>[] }

//export interface CardAndStyle<C extends CardData = CardData> {
//  cardData: C;
//  style: StyleDef<C>;
//}
