/**
 * Order utility functions for Polypure SDK.
 *
 * Helpers for price alignment and order validation according
 * to Polymarket's tick-size rules.
 */

import { ValidationError } from "../errors.js";

/**
 * Get the tick size for a given price.
 *
 * Default tick is 0.01. Near extremes (price > 0.96 or < 0.04)
 * the tick narrows to 0.001 for finer granularity.
 *
 * @param price - Price between 0 and 1.
 * @returns Tick size (0.01 or 0.001).
 */
export function getTickSize(price: number): number {
  return price > 0.96 || price < 0.04 ? 0.001 : 0.01;
}

/**
 * Align a price to the nearest valid tick.
 *
 * Rounds to the closest tick, clamps to [0, 1], and
 * formats to the appropriate decimal precision.
 *
 * @param price - Raw price to align.
 * @returns Aligned price snapped to a valid tick.
 */
export function alignPrice(price: number): number {
  const tick = getTickSize(price);
  const steps = Math.round(price / tick);
  const aligned = steps * tick;
  const clamped = Math.min(1, Math.max(0, aligned));
  const decimals = tick === 0.001 ? 3 : 2;
  return parseFloat(clamped.toFixed(decimals));
}

/**
 * Normalize and validate order parameters.
 *
 * Ensures the amount meets the minimum size requirement,
 * the price is within (0, 1], and aligns the price to a valid tick.
 *
 * @param amount - Order size (must be >= minSize).
 * @param price - Order price in (0, 1].
 * @param minSize - Minimum allowed order size (default: 5).
 * @returns Validated and aligned { amount, price }.
 */
export function normalizeOrder(
  amount: number,
  price: number,
  minSize = 5
): { amount: number; price: number } {
  if (amount < minSize) {
    throw new ValidationError(`Amount ${amount} below minimum ${minSize}`);
  }
  if (price <= 0 || price > 1) {
    throw new ValidationError(`Price ${price} must be in (0, 1]`);
  }
  return { amount, price: alignPrice(price) };
}
