/**
 * Profile-related types for Polymarket SDK.
 *
 * Covers user profile data, aggregated statistics,
 * and portfolio summaries.
 */

import type { Position } from "./position.js";

/** Public profile for a wallet address. */
export interface UserProfile {
  address: string;
  username?: string;
  avatar?: string;
  created_at?: string;
  stats?: ProfileStats;
}

/** Aggregated trading statistics for a user. */
export interface ProfileStats {
  total_trades?: number;
  total_volume?: number;
  total_earnings?: number;
  markets_traded?: number;
  win_rate?: number;
  roi?: number;
}

/** Portfolio summary combining positions with PnL metrics. */
export interface UserPortfolio {
  address: string;
  positions: Position[];
  total_value: number;
  total_cost: number;
  unrealized_pnl: number;
  markets_count: number;
}
