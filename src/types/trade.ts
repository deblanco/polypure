/**
 * Trade-related types for Polymarket SDK.
 *
 * Represents executed trades and the options/response shapes
 * used when querying trade history.
 */

import type { OrderSide } from "./order.js";

/** A single executed trade. */
export interface Trade {
  id: string;
  market: string;
  asset_id: string;
  side: OrderSide;
  size: string;
  price: string;
  status: string;
  match_time: string;
  outcome: string;
  transaction_hash: string;
  trader_side: "TAKER" | "MAKER";
  /** Market title from Data API */
  title?: string;
}

/** Options for querying user trades. */
export interface UserTradesOptions {
  address?: string;
  asset_id?: string;
  market?: string;
  next_cursor?: string;
  limit?: number;
}

/** Paginated response containing trades. */
export interface UserTradesResponse {
  trades: Trade[];
  next_cursor?: string;
  count?: number;
}
