import type { AssetRef } from "../schema/types.js";

export interface Card {
    suit: "hearts" | "diamonds" | "clubs" | "spades";
    rank: "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
    art?: AssetRef;
}
