import { renderMtgClassic } from "./styles/mtg/classic/style.js";
import { renderMtgHoloFoil } from "./styles/mtg/holoFoil/style.js";
import { renderPlayingCardClassic } from "./styles/playing-cards/classic/style.js";
import type { StyleRegistry, StyleDef } from "./styles/types.js";
import type { GameId } from "./games/types.js";


export const STYLE_REGISTRY: StyleRegistry = {
  "mtg": [
    { id: "mtg-classic", gameId: "mtg", displayName: "Classic", render: renderMtgClassic },
    { id: "mtg-holo-foil", gameId: "mtg", displayName: "Holo Foil", render: renderMtgHoloFoil },
  ],
  "playing-cards": [
    { id: "playing-cards-classic", gameId: "playing-cards", displayName: "Classic", render: renderPlayingCardClassic },
  ],
};

/**
 * Styles available for one game.
 * Example use: for populating a style picker once a card's game
 * is known.
 */
export function stylesForGame<G extends GameId>(gameId: G): StyleRegistry[G] {
  return STYLE_REGISTRY[gameId];
}

export function selectStyle<G extends GameId>(
  gameId: G,
  styleId: string,
): StyleDef<G> | undefined {
  const style = STYLE_REGISTRY[gameId].find((s) => s.id === styleId);
  return style;
}
