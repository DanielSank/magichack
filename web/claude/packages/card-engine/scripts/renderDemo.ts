/**
 * M1 demo: feeds sample CardData through the engine end-to-end — schema
 * validation, a style's render(), and SVG serialization (including the
 * inline-symbol pipeline via the MTG mana cost field) — with no React and
 * no backend. Run with `npm run demo` from packages/card-engine.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import { selectStyle } from "../src/registry.js";
import { toSvgString } from "../src/render/toSvgString.js";
import type { RenderContext } from "../src/render-tree/types.js";
import type { CardData } from "../src/styles/types.js";
import { parseGameSchema } from "../src/schema/load.js";
import type { FieldValues } from "../src/schema/types.js";
import { validateFieldValues } from "../src/schema/validate.js";
import { packageRoot, resolveFontData, resolveRasterAsset, resolveSymbolSvg } from "./lib/assetResolvers.js";
import { measureText } from "./lib/measureText.js";
import type { GameSchema } from "../src/schema/types.js";
import { load as parseYaml } from "js-yaml";

const repoRoot = resolve(packageRoot, "../..");

function loadSchema(gameId: string): GameSchema {
  const yamlText = readFileSync(join(repoRoot, "game-schemas", `${gameId}.yaml`), "utf-8");
  return parseGameSchema(yamlText);
}

function renderAndSave(
    cardString: string,
    styleId: string,
    context: Omit<RenderContext, "gameSymbols">,
    outFile: string,
): void {
  const raw = parseYaml(cardString) as { gameId: string; fields: FieldValues };
  const schema = loadSchema(raw.gameId);
  // GameSchema {
  //   id: string;
  //   name: string;
  //   defaultStyleId: string;
  //   fields: FieldDef[];
  //   symbols: SymbolMeta[]
  // }

  const result = validateFieldValues(schema, raw.fields);
  // ValidationResult { valid: boolean; errors: FieldError[] }

  if (!result.valid) {
    console.error(`Validation failed for ${outFile}:`, result.errors);
    process.exitCode = 1;
    return;
  }
  const cardData = { gameId: raw.gameId, fields: raw.fields } as unknown as CardData;
  // CardData =
  //  | { gameId: "mtg"; fields: MtgCard }
  //  | { gameId: "playing-cards"; fields: PlayingCardsCard };

  const cardAndStyle = selectStyle(cardData, styleId);
  // CardAndStyle<C extends CardData = CardData> {
  //   cardData: C;
  //   style: StyleDef<C>;
  // }

  if (!cardAndStyle) {
    throw new Error(`No style registered with id "${styleId}" for game "${cardData.gameId}"`);
  }
  const tree = cardAndStyle.style.render(cardAndStyle.cardData, {...context, gameSymbols: schema.symbols});
  const svg = toSvgString(tree, { resolveSymbolSvg, resolveRasterAsset, resolveFontData, measureText });
  const outPath = join(packageRoot, outFile);
  writeFileSync(outPath, svg, "utf-8");
  console.log(`Wrote ${outPath}`);
}

const mtgCardYaml = `
  gameId: mtg
  fields:
      name: Ember Hatchling
      cost: "{1}{R}{R}"
      types: ["Creature", "Dragon"]
      rules: ["Flying.", "{T}: Deal 1 damage to any target."]
      power: "2"
      toughness: "2"
      flavor: "It hatched already breathing fire."
  `;

renderAndSave(mtgCardYaml, "mtg-classic", { positionInSet: 7, setSize: 249 }, "mtg-demo.local.svg");
renderAndSave(mtgCardYaml, "mtg-holo-foil", { positionInSet: 7, setSize: 249 }, "mtg-holo-foil-demo.local.svg");

// Playing-card samples
// One numeric rank (pip grid) and one face card (large glyph fallback).
const sevenOfHearts = `
  gameId: "playing-cards"
  fields:
      suit: hearts
      rank: "7"
`
const queenOfSpades = `
  gameId: "playing-cards"
  fields:
      suit: spades
      rank: "Q"
`
renderAndSave(sevenOfHearts, "playing-cards-classic", {}, "playing-card-demo.local.svg");
renderAndSave(queenOfSpades, "playing-cards-classic", {}, "playing-card-face-demo.local.svg");
