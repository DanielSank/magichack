import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { GameSchemaParseError, parseGameSchema } from "./load.js";

const thisDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(thisDir, "../../../..");

function readRealSchema(gameId: string): string {
  return readFileSync(join(repoRoot, "game-schemas", `${gameId}.yaml`), "utf-8");
}

describe("parseGameSchema", () => {
  it("parses a minimal valid schema", () => {
    const schema = parseGameSchema(`
id: demo
name: Demo Game
defaultStyleId: demo-classic
fields:
  - key: title
    label: Title
    type: string
    required: true
`);
    expect(schema).toEqual({
      id: "demo",
      name: "Demo Game",
      defaultStyleId: "demo-classic",
      fields: [{ key: "title", label: "Title", type: "string", required: true, maxLength: undefined, pattern: undefined }],
    });
  });

  it("parses the real mtg.yaml without throwing and includes the expected fields", () => {
    const schema = parseGameSchema(readRealSchema("mtg"));
    expect(schema.id).toBe("mtg");
    expect(schema.defaultStyleId).toBe("mtg-classic");
    expect(schema.fields.map((f) => f.key)).toEqual(
      expect.arrayContaining(["name", "cost", "types", "rulesText", "power", "toughness", "flavor", "art"]),
    );
  });

  it("parses the real playing-cards.yaml without throwing and includes the expected fields", () => {
    const schema = parseGameSchema(readRealSchema("playing-cards"));
    expect(schema.id).toBe("playing-cards");
    expect(schema.fields.map((f) => f.key)).toEqual(expect.arrayContaining(["suit", "rank", "art"]));
  });

  it("rejects YAML missing a required top-level key", () => {
    expect(() => parseGameSchema("id: demo\nname: Demo\nfields: []")).toThrow(GameSchemaParseError);
  });

  it("rejects a field with an invalid type", () => {
    expect(() =>
      parseGameSchema(`
id: demo
name: Demo
defaultStyleId: demo-classic
fields:
  - { key: x, label: X, type: not-a-real-type }
`),
    ).toThrow(GameSchemaParseError);
  });

  it("rejects a duplicate field key", () => {
    expect(() =>
      parseGameSchema(`
id: demo
name: Demo
defaultStyleId: demo-classic
fields:
  - { key: x, label: X, type: string }
  - { key: x, label: X again, type: string }
`),
    ).toThrow(GameSchemaParseError);
  });

  it("rejects an enum field without a values array", () => {
    expect(() =>
      parseGameSchema(`
id: demo
name: Demo
defaultStyleId: demo-classic
fields:
  - { key: x, label: X, type: enum }
`),
    ).toThrow(GameSchemaParseError);
  });
});
