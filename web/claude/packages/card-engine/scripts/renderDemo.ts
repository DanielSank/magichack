/**
 * M1 demo: feeds sample CardData through the engine end-to-end — schema
 * validation, a style's render(), and SVG serialization (including the
 * inline-symbol pipeline via the MTG mana cost field) — with no React and
 * no backend. Run with `npm run demo` from packages/card-engine.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { findStyle } from "../src/registry.js";
import { toSvgString } from "../src/render/toSvgString.js";
import type { CardData, RenderContext } from "../src/render-tree/types.js";
import { parseGameSchema } from "../src/schema/load.js";
import type { FieldValues } from "../src/schema/types.js";
import { validateFieldValues } from "../src/schema/validate.js";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(scriptDir, "..");
const repoRoot = resolve(packageRoot, "../..");

// Node-fs-based I/O lives here, at the edge - card-engine itself stays free
// of any file/browser API so it can run unmodified elsewhere later.
function resolveSymbolSvg(svgAssetPath: string): string {
  return readFileSync(join(packageRoot, svgAssetPath), "utf-8");
}

function loadSchema(gameId: string) {
  const yamlText = readFileSync(join(repoRoot, "game-schemas", `${gameId}.yaml`), "utf-8");
  return parseGameSchema(yamlText);
}

function renderAndSave(
  gameId: string,
  styleId: string,
  cardData: CardData,
  context: RenderContext,
  outFile: string,
): void {
  const schema = loadSchema(gameId);
  // validateFieldValues works schema-first: it doesn't know about any
  // specific game's Card type, only the generic FieldValues shape it
  // validates untrusted data against. Widening to that here is always safe
  // (every Card's fields already satisfy FieldValues' value union) — unlike
  // toRegistryStyle's cast, this one needs no runtime check first.
  const result = validateFieldValues(schema, cardData.fields as unknown as FieldValues);
  if (!result.valid) {
    console.error(`Validation failed for ${outFile}:`, result.errors);
    process.exitCode = 1;
    return;
  }

  const style = findStyle(styleId);
  if (!style) {
    throw new Error(`No style registered with id "${styleId}"`);
  }

  const tree = style.render(cardData, context);
  const svg = toSvgString(tree, { resolveSymbolSvg });
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
renderAndSave("mtg", "mtg-classic", mtgCard, { positionInSet: 7, setSize: 249 }, "mtg-demo.local.svg");
renderAndSave(
  "mtg",
  "mtg-holo-foil",
  mtgCard,
  { positionInSet: 7, setSize: 249 },
  "mtg-holo-foil-demo.local.svg",
);

// Playing-card samples — prove the abstraction isn't MTG-specific: one
// numeric rank (pip grid) and one face card (large glyph fallback).
const sevenOfHearts: CardData = {
  gameId: "playing-cards",
  fields: { suit: "hearts", rank: "7" },
};
renderAndSave("playing-cards", "playing-cards-classic", sevenOfHearts, {}, "playing-card-demo.local.svg");

const queenOfSpades: CardData = {
  gameId: "playing-cards",
  fields: { suit: "spades", rank: "Q" },
};
renderAndSave(
  "playing-cards",
  "playing-cards-classic",
  queenOfSpades,
  {},
  "playing-card-face-demo.local.svg",
);
