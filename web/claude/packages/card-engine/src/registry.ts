import { renderMtgClassic } from "./styles/mtg/classic/style.js";
import { renderMtgHoloFoil } from "./styles/mtg/holoFoil/style.js";
import { renderPlayingCardClassic } from "./styles/playing-cards/classic/style.js";
import { toRegistryStyle } from "./styles/types.js";
import type { StyleDef } from "./styles/types.js";

/**
 * Static, code-defined style registry (Tier 1 — first-party TypeScript
 * styles only; user-authored styles are a future phase requiring
 * sandboxing, not built here). Not a DB table: the backend stores a card's
 * `styleId` as an opaque string and never inspects or runs this.
 */
export const STYLE_REGISTRY: StyleDef[] = [
  toRegistryStyle({ id: "mtg-classic", gameId: "mtg", displayName: "Classic", render: renderMtgClassic }),
  toRegistryStyle({ id: "mtg-holo-foil", gameId: "mtg", displayName: "Holo Foil", render: renderMtgHoloFoil }),
  toRegistryStyle({
    id: "playing-cards-classic",
    gameId: "playing-cards",
    displayName: "Classic",
    render: renderPlayingCardClassic,
  }),
];

export function findStyle(styleId: string): StyleDef | undefined {
  return STYLE_REGISTRY.find((s) => s.id === styleId);
}

export function stylesForGame(gameId: string): StyleDef[] {
  return STYLE_REGISTRY.filter((s) => s.gameId === gameId);
}
