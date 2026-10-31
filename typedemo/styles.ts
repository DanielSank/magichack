// Styles: pure functions from a structured card to renderable data.
// Each style belongs to exactly one schema.

import type { CardMap, SchemaName } from "./schemas.ts";

// The render function's input. Its shape doesn't matter for this exercise.
export type Renderable = string[];

// A style for cards whose payload type is C.
export type Style<C> = (card: C) => Renderable;

// For each schema name K, a table of named styles that accept CardMap[K].
// Same "mapped type over SchemaName" form as in schemas.ts, so that
// StyleMap[K] stays tied to CardMap[K] inside generic functions.
export type StyleMap = { [K in SchemaName]: Record<string, Style<CardMap[K]>> };

// The annotation does two jobs: each `card` parameter below gets its type from
// the schema it is filed under, and a style filed under the wrong schema fails
// to compile.
export const styles: StyleMap = {
  playing: {
    ocean: (card) => [`~~~ ${card.rank} of ${card.suit} ~~~`, "(waves in the corners)"],
    vegas: (card) => [`$$$ ${card.rank} of ${card.suit} $$$`, "(neon border)"],
  },
  greeting: {
    floral: (card) => [`Dear ${card.recipient},`, card.message, "(roses around the edge)"],
  },
};
