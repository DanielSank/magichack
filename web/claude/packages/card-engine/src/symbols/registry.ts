/**
 * SYMBOL_REGISTRY is the vocabulary. Every symbol id that exists, with metadata
 * (gameId/displayName) but no art. parseInlineSymbols uses it to decide whether
 * a `{...}` token is a real, known symbol, independent of any particular box
 * or font.
 *
 * SYMBOL_FONTS holds actual drawable symbols, grouped into named, self-
 * contained sets (e.g. "mtg-small", "mtg-large"). A TextBox names exactly one
 * font via symbolFont. findSymbolArt looks up within that one font. A box with
 * no symbolFont or a font that doesn't list a given id, simply has no art for
 * that symbol.
 */
export interface SymbolMeta {
  id: string;
  gameId: string | "shared";
  displayName: string;
}

export type SymbolAsset =
  | { id: string; kind: "svg"; svgAssetPath: string }
  | { id: string; kind: "raster"; rasterAssetPath: string };

export const SYMBOL_REGISTRY: SymbolMeta[] = [
  { id: "mana-w", gameId: "mtg", displayName: "White Mana" },
  { id: "mana-u", gameId: "mtg", displayName: "Blue Mana" },
  { id: "mana-b", gameId: "mtg", displayName: "Black Mana" },
  { id: "mana-r", gameId: "mtg", displayName: "Red Mana" },
  { id: "mana-g", gameId: "mtg", displayName: "Green Mana" },
  { id: "mana-d", gameId: "mtg", displayName: "Desert Mana" },
  { id: "mana-c", gameId: "mtg", displayName: "Colorless Mana" },
  { id: "mana-tap", gameId: "mtg", displayName: "Tap" },
  { id: "mana-x", gameId: "mtg", displayName: "Variable Mana (X)" },
  { id: "mana-y", gameId: "mtg", displayName: "Variable Mana (Y)" },
  { id: "mana-z", gameId: "mtg", displayName: "Variable Mana (Z)" },
  ...Array.from({ length: 28 }, (_, n) => ({
    id: `mana-generic-${n}`,
    gameId: "mtg" as const,
    displayName: `Generic Mana (${n})`,
  })),
  { id: "suit-hearts", gameId: "playing-cards", displayName: "Hearts" },
  { id: "suit-diamonds", gameId: "playing-cards", displayName: "Diamonds" },
  { id: "suit-clubs", gameId: "playing-cards", displayName: "Clubs" },
  { id: "suit-spades", gameId: "playing-cards", displayName: "Spades" },
];

const MTG_SMALL_FONT: SymbolAsset[] = [
  { id: "mana-w", kind: "raster", rasterAssetPath: "assets/symbols-mtg-small/mana_w.png" },
  { id: "mana-u", kind: "raster", rasterAssetPath: "assets/symbols-mtg-small/mana_u.png" },
  { id: "mana-b", kind: "raster", rasterAssetPath: "assets/symbols-mtg-small/mana_b.png" },
  { id: "mana-r", kind: "raster", rasterAssetPath: "assets/symbols-mtg-small/mana_r.png" },
  { id: "mana-g", kind: "raster", rasterAssetPath: "assets/symbols-mtg-small/mana_g.png" },
  { id: "mana-d", kind: "raster", rasterAssetPath: "assets/symbols-mtg-small/mana_d.png" },
  { id: "mana-c", kind: "raster", rasterAssetPath: "assets/symbols-mtg-small/mana_c.png" },
  { id: "mana-tap", kind: "raster", rasterAssetPath: "assets/symbols-mtg-small/mana_t.png" },
  { id: "mana-x", kind: "raster", rasterAssetPath: "assets/symbols-mtg-small/mana_x.png" },
  { id: "mana-y", kind: "raster", rasterAssetPath: "assets/symbols-mtg-small/mana_y.png" },
  { id: "mana-z", kind: "raster", rasterAssetPath: "assets/symbols-mtg-small/mana_z.png" },
  ...Array.from({ length: 28 }, (_, n) => ({
    id: `mana-generic-${n}`,
    kind: "raster" as const,
    rasterAssetPath: `assets/symbols-mtg-small/${n}.png`,
  })),
];

const MTG_LARGE_FONT: SymbolAsset[] = [
  { id: "mana-w", kind: "raster", rasterAssetPath: "assets/symbols-mtg-large/mana_w.png" },
  { id: "mana-u", kind: "raster", rasterAssetPath: "assets/symbols-mtg-large/mana_u.png" },
  { id: "mana-b", kind: "raster", rasterAssetPath: "assets/symbols-mtg-large/mana_b.png" },
  { id: "mana-r", kind: "raster", rasterAssetPath: "assets/symbols-mtg-large/mana_r.png" },
  { id: "mana-g", kind: "raster", rasterAssetPath: "assets/symbols-mtg-large/mana_g.png" },
  { id: "mana-d", kind: "raster", rasterAssetPath: "assets/symbols-mtg-large/mana_d.png" },
  { id: "mana-c", kind: "raster", rasterAssetPath: "assets/symbols-mtg-large/mana_c.png" },
  { id: "mana-x", kind: "raster", rasterAssetPath: "assets/symbols-mtg-large/mana_x.png" },
  { id: "mana-y", kind: "raster", rasterAssetPath: "assets/symbols-mtg-large/mana_y.png" },
  { id: "mana-z", kind: "raster", rasterAssetPath: "assets/symbols-mtg-large/mana_z.png" },
  ...Array.from({ length: 19 }, (_, n) => ({
    id: `mana-generic-${n}`,
    kind: "raster" as const,
    rasterAssetPath: `assets/symbols-mtg-large/${n}.png`,
  })),
];

const PLAYING_CARDS_FONT: SymbolAsset[] = [
  { id: "suit-hearts", kind: "svg", svgAssetPath: "assets/symbols/suit-hearts.svg" },
  { id: "suit-diamonds", kind: "svg", svgAssetPath: "assets/symbols/suit-diamonds.svg" },
  { id: "suit-clubs", kind: "svg", svgAssetPath: "assets/symbols/suit-clubs.svg" },
  { id: "suit-spades", kind: "svg", svgAssetPath: "assets/symbols/suit-spades.svg" },
];

export const SYMBOL_FONTS: Record<string, SymbolAsset[]> = {
  "mtg-small": MTG_SMALL_FONT,
  "mtg-large": MTG_LARGE_FONT,
  "playing-cards": PLAYING_CARDS_FONT,
};

export function isKnownSymbolId(symbolId: string): boolean {
  return SYMBOL_REGISTRY.some((s) => s.id === symbolId);
}

export function findSymbolArt(symbolId: string, symbolFont: string | undefined): SymbolAsset | undefined {
  if (!symbolFont) return undefined;
  return SYMBOL_FONTS[symbolFont]?.find((s) => s.id === symbolId);
}

export function symbolsForGame(gameId: string): SymbolMeta[] {
  return SYMBOL_REGISTRY.filter((s) => s.gameId === gameId || s.gameId === "shared");
}
