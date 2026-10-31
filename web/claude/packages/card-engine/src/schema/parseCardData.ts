import type { GameId, CardMap } from "../games/types.js";
import type { GameSchema, FieldValues } from "./types.js";
import { validateFieldValues, FieldError }from "./validate.js";

type ParseCardDataResult<G extends GameId> =
  | { ok: true; card: CardMap[G] }
  | { ok: false; errors: FieldError[] };

type CardValidator<G extends GameId> = (schema: GameSchema, values: FieldValues) => ParseCardDataResult<G>;

/*
 * There's probably a way to compactify this.
 * We shouldn't have to write out every validator as they're obviously
 * parametrizable by the game id.
 */
export const validators: { [G in GameId]: CardValidator<G> } = {
  "mtg": (schema, values) => {
    const result = validateFieldValues(schema, values);
    if (result.valid) {
      const card: CardMap["mtg"] = values as unknown as CardMap["mtg"];
      return { ok: true, card };
    }
    return { ok: false, errors: result.errors };
  },
  "playing-cards": (schema, values) => {
    const result = validateFieldValues(schema, values);
    if (result.valid) {
      const card: CardMap["playing-cards"] = values as unknown as CardMap["playing-cards"];
      return { ok: true, card };
    }
    return { ok: false, errors: result.errors };
  },
};


export function isGameId(s: string): s is GameId {
  return s in validators;
}

export function parseCardData<G extends GameId>(
  gameId: G,
  schema: GameSchema,
  values: FieldValues,
): CardMap[G] | FieldError[]{
  const validationResult = validators[gameId](schema, values);
  if (validationResult.ok) { return validationResult.card; }
  else { return validationResult.errors; }
}
