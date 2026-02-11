/**
 * Public profile and position queries for Polypure SDK.
 *
 * These functions use the public Data API and work in both
 * Node.js and browser environments (no authentication required).
 */

import { DATA_API_BASE, POLYMARKET_CLOB_HOST } from "./constants.js";
import { httpRequest } from "./http.js";
import { log } from "./logger.js";
import type { Position, PositionSummary, PositionsResponse } from "./types/position.js";
import type { Trade, UserTradesOptions, UserTradesResponse } from "./types/trade.js";
import type { UserProfile } from "./types/profile.js";
import type { OrderSide } from "./types/order.js";
import { PolymarketError } from "./errors.js";

// ============================================================================
// Profile Queries (Public)
// ============================================================================

/**
 * Get profile information for a wallet address.
 *
 * Queries the public profile endpoint. Returns minimal profile
 * if the endpoint is unavailable.
 *
 * @param address - Wallet address to query.
 * @returns User profile with optional username, avatar, etc.
 *
 * @example
 * ```typescript
 * const profile = await getProfile("0xabc123...");
 * console.log(profile.username);
 * ```
 */
export async function getProfile(address: string): Promise<UserProfile> {
  try {
    const response = await httpRequest<{
      address?: string;
      username?: string;
      avatar?: string;
      created_at?: string;
    }>(`${POLYMARKET_CLOB_HOST}/profile/${address}`);

    return {
      address: response.address || address,
      username: response.username,
      avatar: response.avatar,
      created_at: response.created_at,
    };
  } catch (error) {
    log.debug("Profile endpoint unavailable", { address, error });
    // Return minimal profile if endpoint is unavailable
    return { address };
  }
}

// ============================================================================
// Position Queries (Public)
// ============================================================================

/**
 * Get current positions for a specific user by wallet address.
 *
 * Uses the public Data API - no authentication required.
 *
 * @param address - Wallet address to query positions for.
 * @param options - Optional pagination (next_cursor, limit).
 * @returns Paginated positions with per-market summaries.
 *
 * @example
 * ```typescript
 * const positions = await getUserPositions("0xabc123...");
 * console.log(`Positions: ${positions.positions.length}`);
 * ```
 */
export async function getUserPositions(
  address: string,
  options?: {
    next_cursor?: string;
    limit?: number;
  }
): Promise<PositionsResponse> {
  const params: Record<string, string> = { user: address };
  if (options?.next_cursor) params.next_cursor = options.next_cursor;
  if (options?.limit) params.limit = String(options.limit);

  const url = `${DATA_API_BASE}/positions?${new URLSearchParams(params)}`;
  log.debug("Fetching user positions", { address, url });

  const response = await httpRequest<any[]>(url);

  const positions = (response ?? []).map((p: any) => normalizePosition(p));
  const summary = summarizePositions(positions);

  return {
    positions,
    summary,
    next_cursor: undefined, // Data API doesn't use cursor pagination
  };
}

/**
 * Get positions for a specific market.
 *
 * Uses the public Data API - no authentication required.
 *
 * @param conditionId - Market condition ID.
 * @param address - Optional wallet address to filter by.
 * @param options - Optional pagination (next_cursor, limit).
 * @returns Paginated positions with per-market summaries.
 *
 * @example
 * ```typescript
 * // All positions in a market
 * const positions = await getMarketPositions("0xabc123...");
 *
 * // Specific user's positions in a market
 * const userPositions = await getMarketPositions("0xabc123...", "0xdef456...");
 * ```
 */
export async function getMarketPositions(
  conditionId: string,
  address?: string,
  options?: {
    next_cursor?: string;
    limit?: number;
  }
): Promise<PositionsResponse> {
  const params: Record<string, string> = { market: conditionId };
  if (address) params.user = address;
  if (options?.limit) params.limit = String(options.limit);

  const url = `${DATA_API_BASE}/positions?${new URLSearchParams(params)}`;
  log.debug("Fetching market positions", { conditionId, address, url });

  const response = await httpRequest<any[]>(url);

  const positions = (response ?? []).map((p: any) => normalizePosition(p));
  const summary = summarizePositions(positions);

  return {
    positions,
    summary,
    next_cursor: undefined, // Data API doesn't use cursor pagination
  };
}

/**
 * Get all positions for a user (auto-paginated).
 *
 * @param address - Wallet address to query.
 * @returns All positions across all pages.
 */
export async function getAllUserPositions(address: string): Promise<Position[]> {
  const allPositions: Position[] = [];
  let nextCursor: string | undefined;

  do {
    const response = await getUserPositions(address, {
      next_cursor: nextCursor,
      limit: 100,
    });

    allPositions.push(...response.positions);
    nextCursor = response.next_cursor;
  } while (nextCursor);

  return allPositions;
}

// ============================================================================
// Trade Queries (Public)
// ============================================================================

/**
 * Get trades for a specific user address.
 *
 * Uses the public Data API - no authentication required.
 *
 * @param options - Filters (address, asset_id, market) and pagination.
 * @returns Paginated trade response.
 *
 * @example
 * ```typescript
 * const trades = await getUserTrades({
 *   address: "0xabc123...",
 *   limit: 20,
 * });
 * console.log(`Trades: ${trades.trades.length}`);
 * ```
 */
export async function getUserTrades(
  options: UserTradesOptions
): Promise<UserTradesResponse> {
  if (!options.address) {
    throw new PolymarketError("Address is required", "VALIDATION_ERROR");
  }

  const params = new URLSearchParams();
  params.set("user", options.address);
  if (options.asset_id) params.set("asset", options.asset_id);
  if (options.market) params.set("conditionId", options.market);
  if (options.limit) params.set("limit", String(options.limit));

  const url = `${DATA_API_BASE}/trades?${params}`;
  log.debug("Fetching user trades", { address: options.address, url });

  const response = await httpRequest<any[]>(url);
  const trades = (response ?? []).map((t) => normalizeTrade(t));

  return {
    trades,
    next_cursor: undefined, // Data API doesn't use cursor pagination
    count: trades.length,
  };
}

/**
 * Get all trades for a user address.
 *
 * Uses the Data API which returns all trades in a single request.
 *
 * @param address - Wallet address to query.
 * @returns All trades.
 */
export async function getAllTradesForUser(address: string): Promise<Trade[]> {
  const response = await getUserTrades({ address });
  return response.trades;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalise raw position data to a consistent Position shape.
 */
function normalizePosition(pos: any): Position {
  return {
    order_id: pos.order_id || pos.orderID,
    asset_id: pos.asset_id || pos.asset || pos.tokenID || pos.tokenId,
    side: (pos.side as OrderSide) || "BUY",
    size: String(pos.size ?? "0"),
    price: String(pos.price ?? pos.avgPrice ?? pos.curPrice ?? "0"),
    original_size: pos.original_size || pos.originalSize,
    original_price: pos.original_price || pos.originalPrice,
    filled_size: pos.filled_size || pos.filledSize,
    remaining_size: pos.remaining_size || pos.remainingSize,
    status: pos.status || "OPEN",
    outcome: pos.outcome || "",
    condition_id: pos.condition_id || pos.conditionId || pos.market || "",
    market_question: pos.market_question || pos.question || pos.title,
    market_slug: pos.market_slug || pos.slug,
    created_at: pos.created_at || pos.createdAt || new Date().toISOString(),
    updated_at: pos.updated_at || pos.updatedAt,
  };
}

/**
 * Normalise raw trade data from Data API to Trade shape.
 */
function normalizeTrade(trade: any): Trade {
  return {
    id: trade.transactionHash || trade.id,
    market: trade.conditionId || trade.market,
    asset_id: trade.asset || trade.asset_id,
    side: (trade.side as OrderSide) || "BUY",
    size: String(trade.size ?? "0"),
    price: String(trade.price ?? "0"),
    status: "FILLED",
    match_time: trade.timestamp
      ? new Date(trade.timestamp * 1000).toISOString()
      : new Date().toISOString(),
    outcome: trade.outcome || "",
    transaction_hash: trade.transactionHash || "",
    trader_side: "TAKER", // Data API doesn't provide this, default to TAKER
    title: trade.title,
  };
}

/**
 * Summarise positions by market, computing totals and averages.
 */
function summarizePositions(positions: Position[]): PositionSummary[] {
  const marketMap = new Map<string, Position[]>();

  for (const pos of positions) {
    const key = pos.condition_id;
    if (!marketMap.has(key)) {
      marketMap.set(key, []);
    }
    marketMap.get(key)!.push(pos);
  }

  const summaries: PositionSummary[] = [];

  for (const [conditionId, marketPositions] of marketMap) {
    const firstPos = marketPositions[0];
    const side = firstPos.side;
    const totalSize = marketPositions.reduce(
      (sum, p) => sum + parseFloat(p.size),
      0
    );
    const avgPrice =
      marketPositions.reduce(
        (sum, p) => sum + parseFloat(p.price) * parseFloat(p.size),
        0
      ) / totalSize;

    summaries.push({
      condition_id: conditionId,
      question: firstPos.market_question || "",
      market_slug: firstPos.market_slug || "",
      positions: marketPositions,
      total_size: totalSize,
      avg_price: avgPrice,
      side,
      outcome: firstPos.outcome || "",
    });
  }

  return summaries;
}
