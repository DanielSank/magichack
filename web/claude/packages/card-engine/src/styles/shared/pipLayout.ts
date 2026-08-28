export interface PipPosition {
  /** Fraction of card width, 0-1, at the pip's center. */
  x: number;
  /** Fraction of card height, 0-1, at the pip's center. */
  y: number;
  /** True for pips in the bottom half, which are conventionally drawn upside-down. */
  flipped?: boolean;
}

/**
 * Normalized (0-1) center positions for the pip layout of a numeric rank
 * (2-10) or Ace, symmetric about the card's center. Face cards (J/Q/K)
 * return an empty array — callers should render a large rank glyph instead.
 *
 * Shared across playing-card styles so each doesn't reimplement pip
 * placement; positions are a simplified approximation of real card layouts,
 * not a faithful historical reproduction.
 */
export function pipLayoutForRank(rank: string): PipPosition[] {
  const LEFT = 0.3;
  const CENTER = 0.5;
  const RIGHT = 0.7;
  const row = {
    top: 0.22,
    upperMid: 0.34,
    midHigh: 0.42,
    middle: 0.5,
    midLow: 0.58,
    lowerMid: 0.66,
    bottom: 0.78,
  };

  switch (rank) {
    case "A":
      return [{ x: CENTER, y: row.middle }];
    case "2":
      return [
        { x: CENTER, y: row.top },
        { x: CENTER, y: row.bottom, flipped: true },
      ];
    case "3":
      return [
        { x: CENTER, y: row.top },
        { x: CENTER, y: row.middle },
        { x: CENTER, y: row.bottom, flipped: true },
      ];
    case "4":
      return [
        { x: LEFT, y: row.top },
        { x: RIGHT, y: row.top },
        { x: LEFT, y: row.bottom, flipped: true },
        { x: RIGHT, y: row.bottom, flipped: true },
      ];
    case "5":
      return [
        { x: LEFT, y: row.top },
        { x: RIGHT, y: row.top },
        { x: CENTER, y: row.middle },
        { x: LEFT, y: row.bottom, flipped: true },
        { x: RIGHT, y: row.bottom, flipped: true },
      ];
    case "6":
      return [
        { x: LEFT, y: row.top },
        { x: RIGHT, y: row.top },
        { x: LEFT, y: row.middle },
        { x: RIGHT, y: row.middle },
        { x: LEFT, y: row.bottom, flipped: true },
        { x: RIGHT, y: row.bottom, flipped: true },
      ];
    case "7":
      return [
        { x: LEFT, y: row.top },
        { x: RIGHT, y: row.top },
        { x: CENTER, y: row.upperMid },
        { x: LEFT, y: row.middle },
        { x: RIGHT, y: row.middle },
        { x: LEFT, y: row.bottom, flipped: true },
        { x: RIGHT, y: row.bottom, flipped: true },
      ];
    case "8":
      return [
        { x: LEFT, y: row.top },
        { x: RIGHT, y: row.top },
        { x: CENTER, y: row.upperMid },
        { x: LEFT, y: row.midHigh },
        { x: RIGHT, y: row.midHigh },
        { x: CENTER, y: row.lowerMid, flipped: true },
        { x: LEFT, y: row.bottom, flipped: true },
        { x: RIGHT, y: row.bottom, flipped: true },
      ];
    case "9":
      return [
        { x: LEFT, y: row.top },
        { x: RIGHT, y: row.top },
        { x: LEFT, y: row.midHigh },
        { x: RIGHT, y: row.midHigh },
        { x: CENTER, y: row.middle },
        { x: LEFT, y: row.midLow, flipped: true },
        { x: RIGHT, y: row.midLow, flipped: true },
        { x: LEFT, y: row.bottom, flipped: true },
        { x: RIGHT, y: row.bottom, flipped: true },
      ];
    case "10":
      return [
        { x: LEFT, y: row.top },
        { x: RIGHT, y: row.top },
        { x: CENTER, y: row.upperMid },
        { x: LEFT, y: row.midHigh },
        { x: RIGHT, y: row.midHigh },
        { x: LEFT, y: row.midLow, flipped: true },
        { x: RIGHT, y: row.midLow, flipped: true },
        { x: CENTER, y: row.lowerMid, flipped: true },
        { x: LEFT, y: row.bottom, flipped: true },
        { x: RIGHT, y: row.bottom, flipped: true },
      ];
    default:
      return [];
  }
}
