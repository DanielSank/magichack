/**
 * The two statically-defined games, loaded client-side. `parseGameSchema`
 * deliberately takes a YAML string rather than a path (see card-engine's
 * schema/load.ts) specifically so this works: Vite's `?raw` suffix inlines
 * the file's text at build time, no fetch/fs required.
 */
import { parseGameSchema } from "@magichack/card-engine";
import type { GameSchema } from "@magichack/card-engine";

import mtgYaml from "../../../game-schemas/mtg.yaml?raw";
import playingCardsYaml from "../../../game-schemas/playing-cards.yaml?raw";
// Vite magic that bundles the yaml

export const GAME_SCHEMAS: GameSchema[] = [parseGameSchema(mtgYaml), parseGameSchema(playingCardsYaml)];
