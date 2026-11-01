/**
 * M1 demo: feeds sample CardData through the engine end-to-end — schema
 * validation, a style's render(), and SVG serialization (including the
 * inline-symbol pipeline via the MTG mana cost field) — with no React and
 * no backend. Run with `npm run demo` from packages/card-engine.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { selectStyle } from "../src/registry.js";
import { toSvgString } from "../src/render/toSvgString.js";
import type { RenderContext } from "../src/render-tree/types.js";
import type { FieldValues } from "../src/schema/types.js";
import { packageRoot, resolveFontData, resolveRasterAsset, resolveSymbolSvg } from "./lib/assetResolvers.js";
import { measureText } from "./lib/measureText.js";
import { load as parseYaml } from "js-yaml";
import { parseCardData, isGameId } from "../src/schema/parseCardData.js";
import { loadSchema, MTG_CARD_YAML } from "./util.js";

// TODO: Maybe, make this the the only function that can throw, i.e. so none of
// its subroutines throw. A disadvantage of that could be the burden of
// propogating error data up to here.
function renderAndSave(
    cardString: string,
    styleId: string,
    context: Omit<RenderContext, "gameSymbols">,
    outFile: string,
): void {
  const raw = parseYaml(cardString) as { gameId: string; fields: FieldValues };
  // TODO: We should make sure that the parsed card yaml has gameId here instead of casting.

  const gameId = raw.gameId;
  if (!isGameId(gameId)) { throw new Error(`game id ${gameId} is not valid.`) }
  const schema = loadSchema(gameId); // Can throw

  const maybeCardData = parseCardData(gameId, schema, raw.fields);
  if (Array.isArray(maybeCardData)) {
    throw new Error(`Card parsing failed with errors ${maybeCardData}`);
  }
  const style = selectStyle(gameId, styleId);
  if (!style) {
    throw new Error(`No style registered with id "${styleId}" for game "${gameId}"`);
  }
  const tree = style.render(maybeCardData, {...context, gameSymbols: schema.symbols});
  const svg = toSvgString(tree, { resolveSymbolSvg, resolveRasterAsset, resolveFontData, measureText });
  const outPath = join(packageRoot, outFile);
  writeFileSync(outPath, svg, "utf-8");
  console.log(`Wrote ${outPath}`);
}

renderAndSave(MTG_CARD_YAML, "mtg-classic", { positionInSet: 7, setSize: 249 }, "mtg-demo.local.svg");
renderAndSave(MTG_CARD_YAML, "mtg-holo-foil", { positionInSet: 7, setSize: 249 }, "mtg-holo-foil-demo.local.svg");

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
