/**
 * Orderbook utility functions for Polypure SDK.
 *
 * Analytics helpers for extracting best prices, spread,
 * depth, and arbitrage signals from an orderbook snapshot.
 */

import type { Orderbook } from "../types/orderbook.js";

/**
 * Extract the best bid, best ask, and spread from an orderbook.
 *
 * @param orderbook - Orderbook snapshot.
 * @returns Best bid/ask prices (null if side is empty) and the spread.
 */
export function getBestPrices(orderbook: Orderbook): {
  bestBid: number | null;
  bestAsk: number | null;
  spread: number;
} {
  const bestBid = orderbook.bids.length
    ? Math.max(...orderbook.bids.map((b) => b.price))
    : null;
  const bestAsk = orderbook.asks.length
    ? Math.min(...orderbook.asks.map((a) => a.price))
    : null;

  return {
    bestBid,
    bestAsk,
    spread: bestBid !== null && bestAsk !== null ? bestAsk - bestBid : Infinity,
  };
}

/**
 * Calculate the bid-ask spread for an orderbook.
 *
 * @param orderbook - Orderbook snapshot.
 * @returns Spread (Infinity if either side is empty).
 */
export function calculateSpread(orderbook: Orderbook): number {
  const { spread } = getBestPrices(orderbook);
  return spread;
}

/**
 * Calculate the total depth on each side of the orderbook.
 *
 * @param orderbook - Orderbook snapshot.
 * @returns Sum of sizes for bids and asks.
 */
export function calculateDepth(orderbook: Orderbook): {
  bidDepth: number;
  askDepth: number;
} {
  return {
    bidDepth: orderbook.bids.reduce((sum, b) => sum + b.size, 0),
    askDepth: orderbook.asks.reduce((sum, a) => sum + a.size, 0),
  };
}

/**
 * Check whether an orderbook presents an arbitrage opportunity.
 *
 * Returns true when the spread is below the given threshold,
 * indicating the bid-ask gap is tight enough for potential arbitrage.
 *
 * @param orderbook - Orderbook snapshot.
 * @param threshold - Maximum spread to qualify as arbitrage (default: 0.98).
 * @returns True if the spread is below threshold.
 */
export function isArbitrage(orderbook: Orderbook, threshold = 0.98): boolean {
  const spread = calculateSpread(orderbook);
  return spread < threshold;
}
