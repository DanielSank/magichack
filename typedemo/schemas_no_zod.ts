// Card schemas, the single source of truth for what a valid card looks like.
//
// The compiler checks each validator's return type against CardMap, but not
// that its runtime checks actually establish that type. Keeping the validators
// in sync with the schemas is on us (see the note above `validators`).

// Allowed values, as runtime arrays. `as const` keeps the literal types, so
// (typeof RANKS)[number] is "A" | "2" | ... | "K" rather than string.
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
const SUITS = ["hearts", "spades", "diamonds", "clubs"] as const;

type PlayingCard = {
  rank: (typeof RANKS)[number],
  suit: (typeof SUITS)[number],
}

type GreetingCard = {
  recipient: string,
  message: string,
}

// The type map: schema name -> payload type.
export type CardMap = {
  playing: PlayingCard;
  greeting: GreetingCard;
};

// "playing" | "greeting"
export type SchemaName = keyof CardMap;

// A parsed card: its payload plus its schema tag. Same as in schemas.ts.
//   FlatCard<"playing"> = { schema: "playing" } & CardMap["playing"]
//   FlatCard            = FlatCard<"playing"> | FlatCard<"greeting">
// The "mapped type indexed by K" form keeps K symbolic inside generic functions.
export type FlatCard<K extends SchemaName = SchemaName> = {
  [P in K]: { schema: P } & CardMap[P];
}[K];

// Turns untyped data into a payload of type C, or throws.
export type Validator<C> = (raw: unknown) => C | null;

// Return bool indicating whether x is Record<string, unknown>
// and narrows x to Record<string, unknown> if true.
export function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

// Return bool indicating whether x is in options and narrows x
// to T if true.
function isOneOf<T extends string>(options: readonly T[], x: unknown): x is T {
  return typeof x === "string" && (options as readonly string[]).includes(x);
}

// ---- Schema validators.

// Returning a NEW object built from narrowed fields (rather than `raw as ...`)
// keeps us mostly honest: the return statement only type-checks after every
// field has been checked. It also drops unknown keys, as Zod does by default.

export function validatePlaying(raw: unknown): CardMap["playing"] | null {
  if (!isRecord(raw)) {
    return null;
  }
  const { rank, suit } = raw;
  if (!isOneOf(RANKS, rank)) {
    console.log(`rank: expected one of ${RANKS.join(", ")}; got ${JSON.stringify(rank)}`);
    return null;
  }
  if (!isOneOf(SUITS, suit)) {
    console.log(`suit: expected one of ${SUITS.join(", ")}; got ${JSON.stringify(suit)}`);
    return null;
  }
  return { rank, suit };
}

export function validateGreeting(raw: unknown): CardMap["greeting"] | null {
  if (!isRecord(raw)) {
    console.log("card must be an object");
    return null;
  }
  const { recipient, message } = raw;
  if (typeof recipient !== "string") {
    console.log("recipient: expected a string");
    return null;
  }
  if (typeof message !== "string") {
    console.log("message: expected a string");
    return null;
  }
  return { recipient, message };
}

// The validators, typed as a mapped type over SchemaName so that inside a
// function generic in K, validators[name] has type Validator<CardMap[K]> and
// returns CardMap[K]. Compare why_no_zod.ts, case 3.
//
// What this annotation does NOT catch: a validator that lies, e.g.
//   greeting: (raw) => raw as CardMap["greeting"]
// compiles fine. With Zod the type is computed from the checks, so it can't.
export const validators: { [K in SchemaName]: Validator<CardMap[K]> } = {
  playing: validatePlaying,
  greeting: validateGreeting,
};
