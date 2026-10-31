import type { AssetRef } from "../schema/types.js";

const SUITS = [ "hearts", "diamonds", "clubs", "spades"] as const;
const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;

export type Card  = {
    suit: (typeof SUITS)[number],
    rank: (typeof RANKS)[number],
    art?: AssetRef,
}
