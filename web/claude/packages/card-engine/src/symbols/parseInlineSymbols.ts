import type { TextRun } from "../render-tree/types.js";
import { findSymbol } from "./registry.js";

const TOKEN_PATTERN = /\{([0-9]+|[WUBRGXCT])\}/g;

function tokenToSymbolId(token: string): string | undefined {
  if (/^[0-9]+$/.test(token)) {
    return `mana-generic-${token}`;
  }
  switch (token) {
    case "W":
      return "mana-w";
    case "U":
      return "mana-u";
    case "B":
      return "mana-b";
    case "R":
      return "mana-r";
    case "G":
      return "mana-g";
    case "C":
      return "mana-c";
    case "X":
      return "mana-x";
    case "T":
      return "mana-tap";
    default:
      return undefined;
  }
}

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
export function parseInlineSymbols(text: string): TextRun[] {
  const runs: TextRun[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(TOKEN_PATTERN)) {
    const fullMatch = match[0];
    const token = match[1] ?? "";
    const index = match.index ?? 0;

    if (index > lastIndex) {
      runs.push({ kind: "text", text: text.slice(lastIndex, index) });
    }

    const symbolId = tokenToSymbolId(token);
    if (symbolId !== undefined && findSymbol(symbolId) !== undefined) {
      runs.push({ kind: "symbol", symbolId });
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
