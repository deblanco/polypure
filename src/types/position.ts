/**
 * Position-related types for Polymarket SDK.
 *
 * Defines open position data, per-market summaries,
 * and paginated position responses.
 */

import type { OrderSide } from "./order.js";

/** A single open position on a market outcome. */
export interface Position {
  order_id?: string;
  asset_id: string;
  side: OrderSide;
  size: string;
  price: string;
  original_size?: string;
  original_price?: string;
  filled_size?: string;
  remaining_size?: string;
  status: string;
  outcome: string;
  condition_id: string;
  market_question?: string;
  market_slug?: string;
  created_at: string;
  updated_at?: string;
}

/** Aggregated summary of positions within a single market. */
export interface PositionSummary {
  condition_id: string;
  question: string;
  market_slug: string;
  positions: Position[];
  total_size: number;
  avg_price: number;
  side: OrderSide;
  /** The outcome being held (Yes/No). */
  outcome: string;
}

/** Paginated response containing positions and summaries. */
export interface PositionsResponse {
  positions: Position[];
  summary: PositionSummary[];
  next_cursor?: string;
}
