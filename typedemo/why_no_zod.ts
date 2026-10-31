// Versions that DON'T compile, kept for comparison with pipeline_no_zod.ts.
// Sibling of why.ts.
//
// Each `@ts-expect-error` marks the line the compiler rejects. If a future
// change made one of these lines compile, `tsc` would flag the unused
// directive, so this file also checks that the explanations stay true.
// Nothing imports this file; it exists only to be type-checked.
//
// Cases 1 and 2 are the same as in why.ts: they're about styles, not parsing.
// Case 3 is the no-Zod version of "skip the mapped-type annotation".

import {
  validateGreeting,
  validatePlaying,
  type FlatCard,
  type SchemaName,
} from "./schemas_no_zod.ts";
import { styles, type Renderable } from "./styles_no_zod.ts";

// 1. No generic: the correlation is lost.
//   card                           : FlatCard<"playing"> | FlatCard<"greeting">
//   styles[card.schema][styleName] : Style<CardMap["playing"]> | Style<CardMap["greeting"]>
// TS types `style` and `card` separately. To call "one of two functions, not
// sure which", the argument must suit BOTH, so the parameter type becomes the
// intersection CardMap["playing"] & CardMap["greeting"]: an object with rank,
// suit, recipient AND message. No single card has all four, so `card` is
// rejected.
export function naive(card: FlatCard, styleName: string): Renderable {
  const style = styles[card.schema][styleName]!;
  // @ts-expect-error: card is not assignable to the intersection of both payloads.
  return style(card);
}

// 2. Generic in K, but card typed with Extract instead of the mapped-type form.
// The style side is fine: card.schema is K, so `style` is Style<CardMap[K]>.
// The card side is not: TS distributes Extract over the union and can't show
// that the result is assignable to CardMap[K].
export function viaExtract<K extends SchemaName>(
  card: Extract<FlatCard, { schema: K }>,
  styleName: string,
): Renderable {
  const style = styles[card.schema][styleName]!;
  // @ts-expect-error: card (a distributed Extract) is not assignable to CardMap[K].
  return style(card);
}

// 3. The same validator functions, but in an object WITHOUT the mapped-type
// annotation that schemas_no_zod.ts puts on `validators`.
// unannotated[name] has type (typeof unannotated)[K]. TS resolves that to
// "validatePlaying or validateGreeting", so calling it returns
// CardMap["playing"] | CardMap["greeting"] instead of CardMap[K]. The result
// can't be shown to be a FlatCard<K>.
const unannotated = { playing: validatePlaying, greeting: validateGreeting };

export function parseWithoutTypeMap<K extends SchemaName>(name: K, raw: unknown): FlatCard<K> {
  const payload = unannotated[name](raw);
  // @ts-expect-error: payload is a union of all payloads, not CardMap[K].
  return { ...payload, schema: name };
}
