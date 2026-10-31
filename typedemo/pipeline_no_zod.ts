// The data flow, without Zod: untyped data from disk -> parsed card -> style
// -> Renderable. Sibling of pipeline.ts.
//
// Every function that touches a card is generic in K extends SchemaName.
// Inside the body, K stands for ONE schema (we don't know which), and the
// card, its validator and its style table all have types written in terms of
// that same K. That shared K is how the compiler knows they belong together.
//
// The only change from pipeline.ts is `readSchemaTag`, which replaces the Zod
// `Envelope` schema. parseAs, parseCard and applyStyle are unchanged: the
// correlated-union pattern doesn't depend on Zod.

import { validators, type FlatCard, type SchemaName, type GreetingCard } from "./schemas_no_zod.ts";
import { styles, type Renderable } from "./styles_no_zod.ts";

// The only check on a raw string.
// Return true if name is one of our schema's names.
// If true, narrow name to SchemaName.
export function isSchemaName(name: unknown): name is SchemaName {
  return typeof name === "string" && Object.hasOwn(validators, name);
}

// Just enough structure to read the tag. Other fields are checked later,
// once we know which schema to check them against.
function readSchemaTag(raw: Record<string, unknown>): string | null {
  const { schema } = raw;
  if (typeof schema !== "string") {
    console.log(`schema: expected a string`);
    return null;
  }
  return schema;
}

// The validators return only the payload fields, so we add the tag back.
export function parseAs<K extends SchemaName>(name: K, raw: unknown): FlatCard<K> | null {
  const payload = validators[name](raw);
  if (payload === null) { return null }
  return { ...payload, schema: name };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

// Untyped data -> a parsed card of SOME schema. The return type is the full
// union FlatCard; which member it is is known only at runtime.
export function parseCard(raw: unknown): FlatCard | null {
  if (!isPlainRecord(raw)) { return null;}
  const schema = readSchemaTag(raw);
  if (!isSchemaName(schema)) {
    console.log(`Unknown schema "${schema}". Known: ${Object.keys(validators).join(", ")}`);
    return null;
  }
  return parseAs(schema, raw);
}

// Apply the style named `styleName` to `card`.
//   card.schema                    : K
//   styles[card.schema]            : StyleMap[K] = Record<string, Style<CardMap[K]>>
//   styles[card.schema][styleName] : Style<CardMap[K]> | undefined
//   card                           : FlatCard<K>, which is assignable to CardMap[K]
// So `style(card)` type-checks. Compare `naive` in why_no_zod.ts, which doesn't.
//
// Callers usually pass the full union FlatCard, so K = SchemaName. That is
// still safe here because the tag (card.schema) and the payload are one
// object; they can't be mismatched.
export function applyStyle<K extends SchemaName>(
  card: FlatCard<K>,
  styleName: string,
): Renderable | null {
  const table = styles[card.schema];
  const style = table[styleName];
  if (style === undefined) {
    console.log(
      `Schema "${card.schema}" has no style "${styleName}". ` +
        `Available: ${Object.keys(table).join(", ")}`,
    );
    return null;
  }
  return style(card);
}
