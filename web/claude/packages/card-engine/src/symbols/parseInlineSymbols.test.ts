import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseGameSchema } from "../schema/load.js";
import { parseInlineSymbols } from "./parseInlineSymbols.js";

// Loads the real mtg.yaml vocabulary rather than a hand-written fixture:
// this file's whole job is checking that real MTG tokens resolve to the
// real symbol ids, so a second hand-maintained copy of the vocabulary would
// defeat the point (and silently stop catching drift between the two).
const thisDir = dirname(fileURLToPath(import.meta.url));
const packageRoot = resolve(thisDir, "../..");
const repoRoot = resolve(packageRoot, "../..");

function loadSchema(gameId: string) {
  const yamlText = readFileSync(join(repoRoot, "game-schemas", `${gameId}.yaml`), "utf-8");
  return parseGameSchema(yamlText);
}

const MTG_SYMBOLS = loadSchema("mtg").symbols;

describe("parseInlineSymbols", () => {
  it("parses a pure mana cost into symbol runs only", () => {
    expect(parseInlineSymbols("{1}{R}{R}", MTG_SYMBOLS)).toEqual([
      { kind: "symbol", symbolId: "mana-generic-1" },
      { kind: "symbol", symbolId: "mana-r" },
      { kind: "symbol", symbolId: "mana-r" },
    ]);
  });

  it("mixes literal text with a symbol in the middle", () => {
    expect(parseInlineSymbols("{T}: deal 2 damage", MTG_SYMBOLS)).toEqual([
      { kind: "symbol", symbolId: "mana-tap" },
      { kind: "text", text: ": deal 2 damage" },
    ]);
  });

  it("handles a symbol surrounded by text on both sides", () => {
    expect(parseInlineSymbols("Pay {W} to draw", MTG_SYMBOLS)).toEqual([
      { kind: "text", text: "Pay " },
      { kind: "symbol", symbolId: "mana-w" },
      { kind: "text", text: " to draw" },
    ]);
  });

  it("returns a single text run for text with no tokens", () => {
    expect(parseInlineSymbols("Flying", MTG_SYMBOLS)).toEqual([{ kind: "text", text: "Flying" }]);
  });

  it("resolves the variable and colorless mana tokens", () => {
    expect(parseInlineSymbols("{X}{Y}{Z}{C}", MTG_SYMBOLS)).toEqual([
      { kind: "symbol", symbolId: "mana-x" },
      { kind: "symbol", symbolId: "mana-y" },
      { kind: "symbol", symbolId: "mana-z" },
      { kind: "symbol", symbolId: "mana-c" },
    ]);
  });

  it("resolves multi-digit generic mana", () => {
    expect(parseInlineSymbols("{10}", MTG_SYMBOLS)).toEqual([{ kind: "symbol", symbolId: "mana-generic-10" }]);
  });

  it("degrades a brace token with no matching pattern to literal text", () => {
    // "Q" isn't a recognized token letter, so the braces never match the
    // token pattern at all and simply pass through as text.
    expect(parseInlineSymbols("{Q} is not a real symbol", MTG_SYMBOLS)).toEqual([
      { kind: "text", text: "{Q} is not a real symbol" },
    ]);
  });
});
