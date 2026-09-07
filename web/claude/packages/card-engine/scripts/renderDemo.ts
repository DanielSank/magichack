/**
 * M1 demo: feeds sample CardData through the engine end-to-end — schema
 * validation, a style's render(), and SVG serialization (including the
 * inline-symbol pipeline via the MTG mana cost field) — with no React and
 * no backend. Run with `npm run demo` from packages/card-engine.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { renderCard } from "../src/registry.js";
import { toSvgString } from "../src/render/toSvgString.js";
import type { RenderContext } from "../src/render-tree/types.js";
import type { CardData } from "../src/styles/types.js";
import { parseGameSchema } from "../src/schema/load.js";
import type { FieldValues } from "../src/schema/types.js";
import { validateFieldValues } from "../src/schema/validate.js";
import { packageRoot, resolveFontData, resolveRasterAsset, resolveSymbolSvg } from "./lib/assetResolvers.js";
import { measureText } from "./lib/measureText.js";

const repoRoot = resolve(packageRoot, "../..");

function loadSchema(gameId: string) {
  const yamlText = readFileSync(join(repoRoot, "game-schemas", `${gameId}.yaml`), "utf-8");
  return parseGameSchema(yamlText);
}

function renderAndSave(styleId: string, cardData: CardData, context: RenderContext, outFile: string): void {
  // gameId comes from cardData itself, not a separate parameter — there's
  // only one source of truth for which game a card belongs to.
  const schema = loadSchema(cardData.gameId);
  // validateFieldValues works schema-first: it doesn't know about any
  // specific game's Card type, only the generic FieldValues shape it
  // validates untrusted data against. Widening to that here is always safe
  // (every Card's fields already satisfy FieldValues' value union) — unlike
  // renderCard's game dispatch, this one needs no runtime check first.
  const result = validateFieldValues(schema, cardData.fields as unknown as FieldValues);
  if (!result.valid) {
    console.error(`Validation failed for ${outFile}:`, result.errors);
    process.exitCode = 1;
    return;
  }

  const tree = renderCard(cardData, styleId, context);
  const svg = toSvgString(tree, { resolveSymbolSvg, resolveRasterAsset, resolveFontData, measureText });
  const outPath = join(packageRoot, outFile);
  writeFileSync(outPath, svg, "utf-8");
  console.log(`Wrote ${outPath}`);
}

// MTG sample — exercises the inline-symbol pipeline via the mana cost field.
const mtgCard: CardData = {
  gameId: "mtg",
  fields: {
    name: "Ember Hatchling",
    cost: "{1}{R}{R}",
    types: ["Creature", "Dragon"],
    rules: ["Flying.", "{T}: Deal 1 damage to any target."],
    power: "2",
    toughness: "2",
    flavor: "It hatched already breathing fire.",
  },
};
renderAndSave("mtg-classic", mtgCard, { positionInSet: 7, setSize: 249 }, "mtg-demo.local.svg");
renderAndSave("mtg-holo-foil", mtgCard, { positionInSet: 7, setSize: 249 }, "mtg-holo-foil-demo.local.svg");

// Playing-card samples — prove the abstraction isn't MTG-specific: one
// numeric rank (pip grid) and one face card (large glyph fallback).
const sevenOfHearts: CardData = {
  gameId: "playing-cards",
  fields: { suit: "hearts", rank: "7" },
};
renderAndSave("playing-cards-classic", sevenOfHearts, {}, "playing-card-demo.local.svg");

const queenOfSpades: CardData = {
  gameId: "playing-cards",
  fields: { suit: "spades", rank: "Q" },
};
renderAndSave("playing-cards-classic", queenOfSpades, {}, "playing-card-face-demo.local.svg");
