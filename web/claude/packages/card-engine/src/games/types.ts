import { Card as MtgCard } from "./magic.js";
import { Card as PlayingCardsCard } from "./playing-cards.js";

export type CardMap= {
  "mtg": MtgCard;
  "playing-cards": PlayingCardsCard;
}

export type GameId = keyof CardMap;
