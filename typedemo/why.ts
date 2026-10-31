// Versions that DON'T compile, kept for comparison with pipeline.ts.
//
// Each `@ts-expect-error` marks the line the compiler rejects. If a future
// change made one of these lines compile, `tsc` would flag the unused
// directive, so this file also checks that the explanations stay true.
// Nothing imports this file; it exists only to be type-checked.

import { cardSchemas, type FlatCard, type SchemaName } from "./schemas.ts";
import { styles, type Renderable } from "./styles.ts";

// 1. No generic: the correlation is lost.
//   card                           : FlatCard<"playing"> | FlatCard<"greeting">
//   styles[card.schema][styleName] : Style<CardMap["playing"]> | Style<CardMap["greeting"]>
// TS types `style` and `card` separately. To call "one of two functions, not
// sure which", the argument must suit BOTH, so the parameter type becomes the
// intersection CardMap["playing"] & CardMap["greeting"]: an object with rank,
// suit, recipient AND message. No single card has all four, so `card` is
// rejected (the error says the playing card is missing message, recipient).
export function naive(card: FlatCard, styleName: string): Renderable {
  const style = styles[card.schema][styleName]!;
  // @ts-expect-error: card is not assignable to the intersection of both payloads.
  return style(card);
}

// 2. Generic in K, but card typed with Extract instead of the mapped-type form.
// The style side is fine: card.schema is K, so `style` is Style<CardMap[K]>.
// The card side is not: TS distributes Extract over the union, giving
//   Extract<FlatCard<"playing">, {schema: K}> | Extract<FlatCard<"greeting">, {schema: K}>
// and it can't show that this union is assignable to CardMap[K].
export function viaExtract<K extends SchemaName>(
  card: Extract<FlatCard, { schema: K }>,
  styleName: string,
): Renderable {
  const style = styles[card.schema][styleName]!;
  // @ts-expect-error: card (a distributed Extract) is not assignable to CardMap[K].
  return style(card);
}

// 3. Generic in K, but using `cardSchemas` directly instead of `validators`.
// cardSchemas[name] has type (typeof cardSchemas)[K], which is not a mapped
// type over SchemaName, so `.parse` returns a union of all payload types
// instead of CardMap[K]. The result can't be shown to be a FlatCard<K>.
export function parseWithoutTypeMap<K extends SchemaName>(name: K, raw: unknown): FlatCard<K> {
  const payload = cardSchemas[name].parse(raw);
  // @ts-expect-error: payload is a union of all payloads, not CardMap[K].
  return { ...payload, schema: name };
}
