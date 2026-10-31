import { readFileSync } from "node:fs";
import { packageRoot } from "./lib/assetResolvers.js";

import type { GameSchema } from "../src/schema/types.js";
import { parseGameSchema } from "../src/schema/load.js";
import { join, resolve } from "node:path";

const repoRoot = resolve(packageRoot, "../..");

export function loadSchema(gameId: string): GameSchema {
  const yamlText = readFileSync(join(repoRoot, "game-schemas", `${gameId}.yaml`), "utf-8");
  return parseGameSchema(yamlText);
}

export const MTG_CARD_YAML = `
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

