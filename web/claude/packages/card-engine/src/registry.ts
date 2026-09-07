import type { RenderContext, RenderTree } from "./render-tree/types.js";
import { renderMtgClassic } from "./styles/mtg/classic/style.js";
import { renderMtgHoloFoil } from "./styles/mtg/holoFoil/style.js";
import { renderPlayingCardClassic } from "./styles/playing-cards/classic/style.js";
import type { CardData, StyleDef } from "./styles/types.js";

type StyleRegistry = { [G in CardData["gameId"]]: StyleDef<Extract<CardData, { gameId: G }>>[] };
/**
 * Styles, keyed by the game they render.
 * StyleRegistry is not generic; G is a mapped type.
*/

export const STYLE_REGISTRY: StyleRegistry = {
  mtg: [
    { id: "mtg-classic", gameId: "mtg", displayName: "Classic", render: renderMtgClassic },
    { id: "mtg-holo-foil", gameId: "mtg", displayName: "Holo Foil", render: renderMtgHoloFoil },
  ],
  "playing-cards": [
    { id: "playing-cards-classic", gameId: "playing-cards", displayName: "Classic", render: renderPlayingCardClassic },
  ],
};

/**
 * Styles available for one game, honestly typed to that game's `CardData`
 * variant (not the full `CardData` union) as long as `gameId` is a literal
 * at the call site — e.g. for populating a style picker once a card's game
 * is already known.
 */
export function stylesForGame<G extends CardData["gameId"]>(gameId: G): StyleRegistry[G] {
  return STYLE_REGISTRY[gameId];
}

/** Style metadata without `render` — safe to hand back for an id lookup that doesn't already know the card's game. */
export interface StyleInfo {
  id: string;
  gameId: CardData["gameId"];
  displayName: string;
}

/** Finds a style by its opaque id alone, searching across every game. Metadata only — see `renderCard` to actually render. */
export function findStyle(styleId: string): StyleInfo | undefined {
  for (const styles of Object.values(STYLE_REGISTRY)) {
    const found = styles.find((s) => s.id === styleId);
    if (found) return found;
  }
  return undefined;
}

/**
 * Finds the style with `styleId` for `card`'s game and renders `card` with
 * it. The one place that dispatches on a card's `gameId` tag to reach a
 * concretely-typed style array — every other consumer just calls this
 * function rather than needing its own "which game is this" branch. The
 * `default` arm's `never` assignment is a compile-time exhaustiveness check:
 * adding a game to `CardData` without a matching `case` here fails to build.
 */
export function renderCard(card: CardData, styleId: string, context: RenderContext): RenderTree {
  switch (card.gameId) {
    case "mtg": {
      const style = STYLE_REGISTRY.mtg.find((s) => s.id === styleId);
      if (!style) throw new Error(`No style registered with id "${styleId}" for game "mtg"`);
      return style.render(card, context);
    }
    case "playing-cards": {
      const style = STYLE_REGISTRY["playing-cards"].find((s) => s.id === styleId);
      if (!style) throw new Error(`No style registered with id "${styleId}" for game "playing-cards"`);
      return style.render(card, context);
    }
    default: {
      const exhaustive: never = card;
      throw new Error(`Unhandled game "${(exhaustive as CardData).gameId}"`);
    }
  }
}
