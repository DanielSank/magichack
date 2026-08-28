import { describe, expect, it } from "vitest";
import { pipLayoutForRank } from "./pipLayout.js";

describe("pipLayoutForRank", () => {
  it.each([
    ["A", 1],
    ["2", 2],
    ["3", 3],
    ["4", 4],
    ["5", 5],
    ["6", 6],
    ["7", 7],
    ["8", 8],
    ["9", 9],
    ["10", 10],
  ] as const)("returns %s pip(s) for rank %s", (rank, expectedCount) => {
    expect(pipLayoutForRank(rank)).toHaveLength(expectedCount);
  });

  it.each(["J", "Q", "K"])("returns no pips for face rank %s", (rank) => {
    expect(pipLayoutForRank(rank)).toEqual([]);
  });

  it("keeps every pip position within the normalized 0-1 range", () => {
    for (const rank of ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10"]) {
      for (const pip of pipLayoutForRank(rank)) {
        expect(pip.x).toBeGreaterThanOrEqual(0);
        expect(pip.x).toBeLessThanOrEqual(1);
        expect(pip.y).toBeGreaterThanOrEqual(0);
        expect(pip.y).toBeLessThanOrEqual(1);
      }
    }
  });
});
