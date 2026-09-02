import type { Card as MtgCard } from "../games/magic.js";
import type { Card as PlayingCardsCard } from "../games/playing-cards.js";
import type { RenderContext, RenderTree } from "../render-tree/types.js";

/** The values a user has entered for one card, scoped to a specific game. */
export type CardData =
  | { gameId: "mtg"; fields: MtgCard }
  | { gameId: "playing-cards"; fields: PlayingCardsCard };

// Per-game aliases, so a style file can name exactly the branch it accepts
// (e.g. `render(card: MtgCardData, ...)`) instead of the full union.
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

/**
 * Adapts a style whose `render` accepts its own game's `CardData` into a
 * `StyleDef<CardData>` safe to store alongside styles for other games
 * (see STYLE_REGISTRY). Wraps the narrow `render` in a runtime `gameId` check.
 * Once that check passes, the `as C` is a deliberate, one-line-guarded
 * assertion, not a blind cast.
 */
export function toRegistryStyle<C extends CardData>(style: StyleDef<C>): StyleDef {
  return {
    ...style,
    render: (card, context) => {
      if (card.gameId !== style.gameId) {
        throw new Error(`Style "${style.id}" is for game "${style.gameId}", got a "${card.gameId}" card`);
      }
      return style.render(card as C, context);
    },
  };
}
