// Card schemas: the single source of truth for what a valid card looks like.
//
// Everything else (the type map CardMap, the parsed card type FlatCard, the
// style tables in styles.ts) is derived from `cardSchemas` by indexing with a
// schema name. That shared index is what lets TypeScript see that a card and
// its style belong together (see pipeline.ts and why.ts).

import { z } from "zod";

// One Zod schema per card schema, keyed by schema name. These describe the
// card's payload only; the "schema" tag is handled separately (see FlatCard).
export const cardSchemas = {
  playing: z.object({
    rank: z.enum(["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"]),
    suit: z.enum(["hearts", "spades", "diamonds", "clubs"]),
  }),
  greeting: z.object({
    recipient: z.string(),
    message: z.string(),
  }),
};

// "playing" | "greeting"
export type SchemaName = keyof typeof cardSchemas;

// The type map: schema name -> payload type.
// Derived from the Zod schemas via z.infer, so the static types and the
// runtime checks cannot drift apart.
//   CardMap["playing"]  = { rank: "A" | ... | "K"; suit: "hearts" | ... }
//   CardMap["greeting"] = { recipient: string; message: string }
export type CardMap = { [K in SchemaName]: z.infer<(typeof cardSchemas)[K]> };

// A parsed card: its payload plus its schema tag.
//   FlatCard<"playing"> = { schema: "playing" } & CardMap["playing"]
//   FlatCard            = FlatCard<"playing"> | FlatCard<"greeting">
//                         (K defaults to every schema name)
// The form "mapped type indexed by K", { [P in K]: ... }[K], is deliberate:
// TS (>= 4.6) recognizes it and keeps K symbolic inside generic functions.
// P is just the mapped type's loop variable over the names in K.
export type FlatCard<K extends SchemaName = SchemaName> = {
  [P in K]: { schema: P } & CardMap[P];
}[K];

// The same objects as `cardSchemas`, re-typed as a mapped type over SchemaName.
//
// Why bother: inside a function generic in K, `cardSchemas[name]` has type
// (typeof cardSchemas)[K]. TS can't turn `.parse` on that into something that
// returns CardMap[K]; it falls back to a union of all payload types (see
// why.ts). Through this annotation, `validators[name]` has type
// z.ZodType<CardMap[K]>, whose `.parse` returns CardMap[K].
// The assignment is checked: each Zod schema must produce its CardMap entry.
export const validators: { [K in SchemaName]: z.ZodType<CardMap[K]> } = cardSchemas;
