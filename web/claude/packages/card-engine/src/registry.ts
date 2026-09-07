import { renderMtgClassic } from "./styles/mtg/classic/style.js";
import { renderMtgHoloFoil } from "./styles/mtg/holoFoil/style.js";
import { renderPlayingCardClassic } from "./styles/playing-cards/classic/style.js";
import type { CardAndStyle, CardData, StyleDef, StyleRegistry } from "./styles/types.js";


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

export function selectStyle<C extends CardData>(cardData: C, styleId: string): CardAndStyle<C> | undefined {
  // `as unknown as` (not a direct `as`): the actual registry value is a
  // union across every game's array, which TS correctly sees as too
  // unrelated to the caller's specific `C` to allow a direct cast — the
  // `unknown` hop is where we assert the link `renderCard` used to make
  // implicitly, now made explicit since `C` is generic here.
  const styles = STYLE_REGISTRY[cardData.gameId] as unknown as StyleDef<C>[];
  const style = styles.find((s) => s.id === styleId);
  return style ? { cardData, style } : undefined;
}
