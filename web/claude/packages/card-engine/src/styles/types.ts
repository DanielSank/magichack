import type { CardData, RenderContext, RenderTree } from "../render-tree/types.js";

/**
 * A style is a pure function: it decides values and layout, never draws
 * pixels. `context` stays narrow by design — no access to other cards.
 *
 * Generic over which `CardData` branch this style accepts (default: the
 * full union), so a specific style's `render` can be typed to only its own
 * game's fields, e.g. `RenderFn<MtgCardData>`.
 */
export type RenderFn<C extends CardData = CardData> = (card: C, context: RenderContext) => RenderTree;

export interface StyleDef<C extends CardData = CardData> {
  id: string;
  gameId: C["gameId"];
  displayName: string;
  render: RenderFn<C>;
}

/**
 * Adapts a style whose `render` only accepts its own game's `CardData`
 * branch into a `StyleDef<CardData>` safe to store alongside styles for
 * other games (see STYLE_REGISTRY). No type-level link connects a `styleId`
 * string to the `CardData` a caller eventually passes it — that's decided at
 * runtime, the same way a card's `gameId` is only checked against its
 * `GameSchema` at runtime, not compile time. So this wraps the narrow
 * `render` in a runtime `gameId` check; once that check passes, the `as C`
 * is a deliberate, one-line-guarded assertion, not a blind cast.
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
