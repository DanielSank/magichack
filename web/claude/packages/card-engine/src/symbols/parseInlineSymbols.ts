import type { TextRun } from "../render-tree/types.js";
import type { SymbolMeta } from "./registry.ts";

const TOKEN_PATTERN = /\{([0-9A-Z]+)\}/g;

/**
 * Splits text containing brace-delimited symbol tokens (e.g. "{2}{R}{R}", or
 * "{T}: deal 2 damage") into a mix of literal text and symbol runs, resolving
 * each token against the symbol registry.
 *
 * Any style that needs inline symbols (mana costs, rules text with a tap
 * symbol, etc.) should call this rather than reimplementing token parsing.
 *
 * Unrecognized or unregistered tokens degrade gracefully to literal text
 * (braces included) instead of throwing — a typo or a symbol that hasn't
 * been registered yet should never break rendering.
 */
export function parseInlineSymbols(text: string, symbols: SymbolMeta[]): TextRun[] {
  const runs: TextRun[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const fullMatch = match[0];
    const token = match[1] ?? "";
    const index = match.index ?? 0;

    if (index > lastIndex) {
      runs.push({ kind: "text", text: text.slice(lastIndex, index) });
    }

    const maybeSymbolMeta = symbols.find(s => s.token === token);
    if (maybeSymbolMeta !== undefined) {
      runs.push({ kind: "symbol", symbolId: maybeSymbolMeta.id });
    } else {
      runs.push({ kind: "text", text: fullMatch });
    }

    lastIndex = index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    runs.push({ kind: "text", text: text.slice(lastIndex) });
  }

  return mergeAdjacentTextRuns(runs);
}

function mergeAdjacentTextRuns(runs: TextRun[]): TextRun[] {
  const merged: TextRun[] = [];
  for (const run of runs) {
    const prev = merged[merged.length - 1];
    if (run.kind === "text" && prev?.kind === "text") {
      prev.text += run.text;
    } else {
      merged.push({ ...run });
    }
  }
  return merged;
}
