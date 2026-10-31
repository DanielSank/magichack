// Usage:   npm start -- <card.json> <style>
// Example: npm start -- cards/queen_of_spades.json ocean
// (`npm start` compiles src/ to dist/ with tsc, then runs dist/main.js.)

import { readFileSync } from "node:fs";
import { applyStyle, parseCard } from "./pipeline.ts";
import type { Renderable } from "./styles.ts";

// Stand-in for the real render function (not part of this exercise).
function render(fields: Renderable): void {
  for (const field of fields) console.log(field);
}

const [path, styleName] = process.argv.slice(2);
if (path === undefined || styleName === undefined) {
  console.error("usage: npm start -- <card.json> <style>");
  process.exit(2);
}

// JSON.parse returns `any`. Store it as `unknown` so the compiler makes us
// validate before using it.
const raw: unknown = JSON.parse(readFileSync(path, "utf8"));

try {
  const card = parseCard(raw); //            FlatCard (union over all schemas)
  const renderable = applyStyle(card, styleName); // K inferred as SchemaName
  render(renderable);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
