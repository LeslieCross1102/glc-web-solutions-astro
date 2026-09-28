import { electricians } from "./electricians";
import { landscapers } from "./landscapers";
import { pubs } from "./pubs";
import type { TradeData, TradeKey } from "./types";

export const trades: Record<TradeKey, TradeData> = { electricians, pubs, landscapers };

export type { TradeData, TradeKey } from "./types";
