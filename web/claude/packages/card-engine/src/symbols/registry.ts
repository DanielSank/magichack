/**
 * The symbol registry maps a symbol id to an SVG asset. It is intentionally
 * data, not code — swapping a placeholder for real artwork later is a file
 * replacement at the same id, never a code change (see assets/symbols/).
 *
 * Assets are plain SVGs (not an icon font): the developer's real symbol art
 * is arbitrary, user-supplied SVG that doesn't map onto a pre-built font or
 * even the standard MTG mana-symbol set, so the renderer treats every symbol
 * as an inline image rather than a font glyph.
 */
export interface SymbolDef {
  id: string;
  /** "shared" or a specific gameId, mirroring the style registry's scoping. */
  gameId: string | "shared";
  displayName: string;
  /** Path to an SVG asset, relative to the card-engine package root. */
  svgAssetPath: string;
}

const MTG_COLOR_SYMBOLS: SymbolDef[] = [
  { id: "mana-w", gameId: "mtg", displayName: "White Mana", svgAssetPath: "assets/symbols/mana-w.svg" },
  { id: "mana-u", gameId: "mtg", displayName: "Blue Mana", svgAssetPath: "assets/symbols/mana-u.svg" },
  { id: "mana-b", gameId: "mtg", displayName: "Black Mana", svgAssetPath: "assets/symbols/mana-b.svg" },
  { id: "mana-r", gameId: "mtg", displayName: "Red Mana", svgAssetPath: "assets/symbols/mana-r.svg" },
  { id: "mana-g", gameId: "mtg", displayName: "Green Mana", svgAssetPath: "assets/symbols/mana-g.svg" },
  { id: "mana-c", gameId: "mtg", displayName: "Colorless Mana", svgAssetPath: "assets/symbols/mana-c.svg" },
];

const MTG_TAP_SYMBOL: SymbolDef = {
  id: "mana-tap",
  gameId: "mtg",
  displayName: "Tap",
  svgAssetPath: "assets/symbols/mana-tap.svg",
};

const MTG_VARIABLE_SYMBOL: SymbolDef = {
  id: "mana-x",
  gameId: "mtg",
  displayName: "Variable Mana (X)",
  svgAssetPath: "assets/symbols/mana-x.svg",
};

// Generic numeric mana ({0}..{20}) all share one placeholder graphic for now.
// Each number still gets its own stable registry id, so swapping in distinct
// per-number art later is additive (new svgAssetPath per id), not a
// restructuring of the registry or the parser.
const MTG_GENERIC_SYMBOLS: SymbolDef[] = Array.from({ length: 21 }, (_, n) => ({
  id: `mana-generic-${n}`,
  gameId: "mtg",
  displayName: `Generic Mana (${n})`,
  svgAssetPath: "assets/symbols/mana-generic.svg",
}));

const PLAYING_CARD_SUIT_SYMBOLS: SymbolDef[] = [
  { id: "suit-hearts", gameId: "playing-cards", displayName: "Hearts", svgAssetPath: "assets/symbols/suit-hearts.svg" },
  { id: "suit-diamonds", gameId: "playing-cards", displayName: "Diamonds", svgAssetPath: "assets/symbols/suit-diamonds.svg" },
  { id: "suit-clubs", gameId: "playing-cards", displayName: "Clubs", svgAssetPath: "assets/symbols/suit-clubs.svg" },
  { id: "suit-spades", gameId: "playing-cards", displayName: "Spades", svgAssetPath: "assets/symbols/suit-spades.svg" },
];

export const SYMBOL_REGISTRY: SymbolDef[] = [
  ...MTG_COLOR_SYMBOLS,
  MTG_TAP_SYMBOL,
  MTG_VARIABLE_SYMBOL,
  ...MTG_GENERIC_SYMBOLS,
  ...PLAYING_CARD_SUIT_SYMBOLS,
];

export function findSymbol(symbolId: string): SymbolDef | undefined {
  return SYMBOL_REGISTRY.find((s) => s.id === symbolId);
}

export function symbolsForGame(gameId: string): SymbolDef[] {
  return SYMBOL_REGISTRY.filter((s) => s.gameId === gameId || s.gameId === "shared");
}
