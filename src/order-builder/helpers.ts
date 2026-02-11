/**
 * Order building helper functions.
 *
 * Provides rounding, amount calculation, and other utility functions
 * for constructing orders with proper precision.
 *
 * @module order-builder/helpers
 */

import { ROUNDING_CONFIG, COLLATERAL_TOKEN_DECIMALS, type TickSize } from "./constants.js";

/**
 * Round a value down to the specified number of decimal places.
 *
 * @param value - The value to round
 * @param decimals - Number of decimal places
 * @returns Rounded value
 */
export function roundDown(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.floor(value * factor) / factor;
}

/**
 * Round a value to the specified number of decimal places (normal rounding).
 *
 * @param value - The value to round
 * @param decimals - Number of decimal places
 * @returns Rounded value
 */
export function roundNormal(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

/**
 * Calculate raw amounts for a BUY order.
 *
 * For BUY orders:
 * - makerAmount = size * price (what the buyer pays in USDC)
 * - takerAmount = size (what the buyer receives in YES tokens)
 *
 * @param size - Order size (number of outcome tokens)
 * @param price - Order price (0-1)
 * @param tickSize - Market tick size
 * @returns Object with rawMakerAmt and rawTakerAmt (in on-chain units)
 */
export function calculateBuyAmounts(
  size: number,
  price: number,
  tickSize: TickSize
): { rawMakerAmt: string; rawTakerAmt: string } {
  const decimals = ROUNDING_CONFIG[tickSize].decimals;

  // Align price to tick size first
  const alignedPrice = alignPrice(price, tickSize);

  // Calculate maker amount (USDC) = size * alignedPrice
  const makerAmount = size * alignedPrice;
  const roundedMakerAmount = roundDown(makerAmount, decimals);

  // Taker amount is just the size (YES tokens)
  const takerAmount = size;

  // Convert to on-chain units (6 decimals for USDC and YES tokens)
  const rawMakerAmt = toChainUnits(roundedMakerAmount);
  const rawTakerAmt = toChainUnits(takerAmount);

  return { rawMakerAmt, rawTakerAmt };
}

/**
 * Calculate raw amounts for a SELL order.
 *
 * For SELL orders:
 * - makerAmount = size (what the seller offers in YES tokens)
 * - takerAmount = size * price (what the seller receives in USDC)
 *
 * @param size - Order size (number of outcome tokens)
 * @param price - Order price (0-1)
 * @param tickSize - Market tick size
 * @returns Object with rawMakerAmt and rawTakerAmt (in on-chain units)
 */
export function calculateSellAmounts(
  size: number,
  price: number,
  tickSize: TickSize
): { rawMakerAmt: string; rawTakerAmt: string } {
  const decimals = ROUNDING_CONFIG[tickSize].decimals;

  // Align price to tick size first
  const alignedPrice = alignPrice(price, tickSize);

  // Maker amount is just the size (YES tokens)
  const makerAmount = size;

  // Calculate taker amount (USDC) = size * alignedPrice
  const takerAmount = size * alignedPrice;
  const roundedTakerAmount = roundDown(takerAmount, decimals);

  // Convert to on-chain units (6 decimals)
  const rawMakerAmt = toChainUnits(makerAmount);
  const rawTakerAmt = toChainUnits(roundedTakerAmount);

  return { rawMakerAmt, rawTakerAmt };
}

/**
 * Calculate raw amounts for a MARKET BUY order.
 *
 * Market orders are executed at the best available price.
 * The taker receives the full maker amount, paying market price.
 *
 * @param amount - Total amount to spend (in USDC)
 * @param price - Current market price
 * @param tickSize - Market tick size
 * @returns Object with rawMakerAmt and rawTakerAmt (in on-chain units)
 */
export function calculateMarketBuyAmounts(
  amount: number,
  price: number,
  tickSize: TickSize
): { rawMakerAmt: string; rawTakerAmt: string } {
  const decimals = ROUNDING_CONFIG[tickSize].decimals;

  // For market buy: makerAmount = total USDC to spend
  const makerAmount = amount;

  // takerAmount = amount / price (how many tokens we expect to receive)
  const takerAmount = price > 0 ? amount / price : 0;
  const roundedTakerAmount = roundDown(takerAmount, decimals);

  // Convert to on-chain units
  const rawMakerAmt = toChainUnits(makerAmount);
  const rawTakerAmt = toChainUnits(roundedTakerAmount);

  return { rawMakerAmt, rawTakerAmt };
}

/**
 * Convert a human-readable amount to on-chain units.
 *
 * @param amount - Human-readable amount (e.g., 100 USDC)
 * @returns Amount in on-chain units as string
 */
function toChainUnits(amount: number): string {
  const factor = Math.pow(10, COLLATERAL_TOKEN_DECIMALS);
  return Math.floor(amount * factor).toString();
}

/**
 * Align a price to the tick size.
 *
 * Rounds the price down to the nearest valid tick size increment.
 *
 * @param price - Raw price (0-1)
 * @param tickSize - Market tick size
 * @returns Aligned price
 */
export function alignPrice(price: number, tickSize: TickSize): number {
  const tick = parseFloat(tickSize);
  const decimals = ROUNDING_CONFIG[tickSize].decimals;
  const aligned = Math.floor(price / tick) * tick;
  // Round to fix floating point precision issues
  return parseFloat(aligned.toFixed(decimals));
}

/**
 * Generate a random salt for order uniqueness.
 *
 * @returns Random 256-bit salt as string
 */
export function generateSalt(): string {
  // Generate a random 32-byte (256-bit) number
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  // Convert to BigInt
  let result = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    result = (result << BigInt(8)) | BigInt(bytes[i]);
  }

  return result.toString();
}
