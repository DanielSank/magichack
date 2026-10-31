// The data flow: untyped data from disk -> parsed card -> style -> Renderable.
//
// Every function that touches a card is generic in K extends SchemaName.
// Inside the body, K stands for ONE schema (we don't know which), and the
// card, its validator and its style table all have types written in terms of
// that same K. That shared K is how the compiler knows they belong together.

import { z } from "zod";
import { validators, type FlatCard, type SchemaName } from "./schemas.ts";
import { styles, type Renderable } from "./styles.ts";

// The only check on a raw string: is it one of our schema names?
export function isSchemaName(name: unknown): name is SchemaName {
  return typeof name === "string" && Object.hasOwn(validators, name);
}

// Just enough structure to read the tag. Other fields are checked later,
// once we know which schema to check them against.
const Envelope = z.object({ schema: z.string() });

// Validate `raw` against the schema named `name`.
//   validators[name]       : z.ZodType<CardMap[K]>
//   validators[name].parse : (raw: unknown) => CardMap[K]   (throws if invalid)
// Zod drops keys it doesn't know, including "schema", so we add the tag back.
export function parseAs<K extends SchemaName>(name: K, raw: unknown): FlatCard<K> {
  const payload = validators[name].parse(raw);
  return { ...payload, schema: name };
}

// Untyped data -> a parsed card of SOME schema. The return type is the full
// union FlatCard; which member it is is known only at runtime.
export function parseCard(raw: unknown): FlatCard {
  const { schema } = Envelope.parse(raw);
  if (!isSchemaName(schema)) {
    throw new Error(`Unknown schema "${schema}". Known: ${Object.keys(validators).join(", ")}`);
  }
  // `schema` is narrowed to SchemaName, so K is inferred as SchemaName here.
  return parseAs(schema, raw);
}

// Apply the style named `styleName` to `card`.
//   card.schema                    : K
//   styles[card.schema]            : StyleMap[K] = Record<string, Style<CardMap[K]>>
//   styles[card.schema][styleName] : Style<CardMap[K]> | undefined
//   card                           : FlatCard<K>, which is assignable to CardMap[K]
// So `style(card)` type-checks. Compare `naive` in why.ts, which doesn't.
//
// Callers usually pass the full union FlatCard, so K = SchemaName. That is
// still safe here because the tag (card.schema) and the payload are one
// object; they can't be mismatched.
export function applyStyle<K extends SchemaName>(card: FlatCard<K>, styleName: string): Renderable {
  const table = styles[card.schema];
  const style = table[styleName];
  if (style === undefined) {
    throw new Error(
      `Schema "${card.schema}" has no style "${styleName}". ` +
        `Available: ${Object.keys(table).join(", ")}`,
    );
  }
  return style(card);
}
