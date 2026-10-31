import { renderMtgClassic } from "./styles/mtg/classic/style.js";
import { renderMtgHoloFoil } from "./styles/mtg/holoFoil/style.js";
import { renderPlayingCardClassic } from "./styles/playing-cards/classic/style.js";
import type { CardAndStyle, CardData, StyleRegistry } from "./styles/types.js";


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
export function stylesForGame<G extends CardData["gameId"]>(gameId: G): StyleRegistry[G] {
  return STYLE_REGISTRY[gameId];
}

export function selectStyle(cardData: CardData, styleId: string): CardAndStyle<CardData> | undefined {
  const style = STYLE_REGISTRY[cardData.gameId].find((s) => s.id === styleId);
  return style ? ({ cardData, style } as CardAndStyle<CardData>) : undefined;
}
