import type { AssetRef } from "../schema/types.js";

export interface Card {
  name: string;
  cost?: string;
  types: string[];
  rulesText?: string;
  power?: string;
  toughness?: string;
  flavor?: string;
  art?: AssetRef;
}
