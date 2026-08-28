import { describe, expect, it } from "vitest";
import { parseInlineSymbols } from "./parseInlineSymbols.js";

describe("parseInlineSymbols", () => {
  it("parses a pure mana cost into symbol runs only", () => {
    expect(parseInlineSymbols("{1}{R}{R}")).toEqual([
      { kind: "symbol", symbolId: "mana-generic-1" },
      { kind: "symbol", symbolId: "mana-r" },
      { kind: "symbol", symbolId: "mana-r" },
    ]);
  });

  it("mixes literal text with a symbol in the middle", () => {
    expect(parseInlineSymbols("{T}: deal 2 damage")).toEqual([
      { kind: "symbol", symbolId: "mana-tap" },
      { kind: "text", text: ": deal 2 damage" },
    ]);
  });

  it("handles a symbol surrounded by text on both sides", () => {
    expect(parseInlineSymbols("Pay {W} to draw")).toEqual([
      { kind: "text", text: "Pay " },
      { kind: "symbol", symbolId: "mana-w" },
      { kind: "text", text: " to draw" },
    ]);
  });

  it("returns a single text run for text with no tokens", () => {
    expect(parseInlineSymbols("Flying")).toEqual([{ kind: "text", text: "Flying" }]);
  });

  it("resolves the variable and colorless mana tokens", () => {
    expect(parseInlineSymbols("{X}{C}")).toEqual([
      { kind: "symbol", symbolId: "mana-x" },
      { kind: "symbol", symbolId: "mana-c" },
    ]);
  });

  it("resolves multi-digit generic mana", () => {
    expect(parseInlineSymbols("{10}")).toEqual([{ kind: "symbol", symbolId: "mana-generic-10" }]);
  });

  it("degrades a brace token with no matching pattern to literal text", () => {
    // "Q" isn't a recognized token letter, so the braces never match the
    // token pattern at all and simply pass through as text.
    expect(parseInlineSymbols("{Q} is not a real symbol")).toEqual([
      { kind: "text", text: "{Q} is not a real symbol" },
    ]);
  });
});
