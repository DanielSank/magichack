import { describe, expect, it } from "vitest";
import type { GameSchema } from "./types.js";
import { validateFieldValues } from "./validate.js";

const SCHEMA: GameSchema = {
  id: "test-game",
  name: "Test Game",
  defaultStyleId: "test-classic",
  fields: [
    { key: "name", label: "Name", type: "string", required: true, maxLength: 10 },
    { key: "code", label: "Code", type: "string", pattern: "^[A-Z]{3}$" },
    { key: "power", label: "Power", type: "integer", min: 0, max: 20 },
    { key: "isFoil", label: "Foil", type: "boolean" },
    { key: "rarity", label: "Rarity", type: "enum", values: ["common", "rare", "mythic"] },
    { key: "art", label: "Art", type: "image" },
  ],
};

describe("validateFieldValues", () => {
  it("passes for a fully valid set of values", () => {
    const result = validateFieldValues(SCHEMA, {
      name: "Ember",
      code: "ABC",
      power: 5,
      isFoil: true,
      rarity: "rare",
      art: { assetId: "asset-1" },
    });
    expect(result).toEqual({ valid: true, errors: [] });
  });

  it("passes when optional fields are omitted", () => {
    const result = validateFieldValues(SCHEMA, { name: "Ember" });
    expect(result.valid).toBe(true);
  });

  it("flags a missing required field", () => {
    const result = validateFieldValues(SCHEMA, {});
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({ key: "name", message: '"Name" is required' });
  });

  it("flags a required field left as an empty string", () => {
    const result = validateFieldValues(SCHEMA, { name: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.key === "name")).toBe(true);
  });

  it("flags a string exceeding maxLength", () => {
    const result = validateFieldValues(SCHEMA, { name: "Way Too Long Name" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.key === "name")).toBe(true);
  });

  it("flags a string not matching its pattern", () => {
    const result = validateFieldValues(SCHEMA, { name: "Ember", code: "abc" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.key === "code")).toBe(true);
  });

  it("passes a string matching its pattern", () => {
    const result = validateFieldValues(SCHEMA, { name: "Ember", code: "XYZ" });
    expect(result.valid).toBe(true);
  });

  it("flags a non-integer value for an integer field", () => {
    const result = validateFieldValues(SCHEMA, { name: "Ember", power: 5.5 });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.key === "power")).toBe(true);
  });

  it("flags an integer outside its min/max range", () => {
    const tooLow = validateFieldValues(SCHEMA, { name: "Ember", power: -1 });
    const tooHigh = validateFieldValues(SCHEMA, { name: "Ember", power: 21 });
    expect(tooLow.valid).toBe(false);
    expect(tooHigh.valid).toBe(false);
  });

  it("flags a non-boolean value for a boolean field", () => {
    const result = validateFieldValues(SCHEMA, { name: "Ember", isFoil: "yes" as unknown as boolean });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.key === "isFoil")).toBe(true);
  });

  it("flags a value not in an enum field's allowed values", () => {
    const result = validateFieldValues(SCHEMA, { name: "Ember", rarity: "legendary" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.key === "rarity")).toBe(true);
  });

  it("flags an image field without a valid assetId", () => {
    const result = validateFieldValues(SCHEMA, { name: "Ember", art: {} as never });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.key === "art")).toBe(true);
  });

  it("flags an unknown field key", () => {
    const result = validateFieldValues(SCHEMA, { name: "Ember", notAField: "x" });
    expect(result.valid).toBe(false);
    expect(result.errors).toContainEqual({
      key: "notAField",
      message: 'Unknown field "notAField" for game "test-game"',
    });
  });
});
