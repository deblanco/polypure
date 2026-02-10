/**
 * Earnings-related types for Polymarket SDK.
 *
 * Represents balance/allowance info and various earnings
 * breakdowns (per-condition, totals, and reward-level details).
 */

/** USDC balance and token allowances. */
export interface BalanceAllowance {
  balance: string;
  allowances: Record<string, string>;
}

/** Daily earnings for a specific condition (market). */
export interface UserEarning {
  date: string;
  condition_id: string;
  asset_address: string;
  maker_address: string;
  earnings: number;
}

/** Aggregated daily earnings across all conditions. */
export interface TotalUserEarning {
  date: string;
  asset_address: string;
  maker_address: string;
  earnings: number;
  asset_rate: number;
}

/** Detailed earnings with associated market metadata. */
export interface UserRewardsEarning {
  condition_id: string;
  question: string;
  market_slug: string;
  event_slug: string;
  image: string;
  earnings: number;
  trades: number;
  volume: number;
  liquidity_provision: number;
  lp_rewards_earned: number;
  competition?: boolean;
}
