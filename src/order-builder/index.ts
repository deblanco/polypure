/**
 * Order builder module for Polypure SDK.
 *
 * Provides utilities for constructing and signing EIP-712 orders
 * for the CTF Exchange on Polygon.
 *
 * @example
 * ```typescript
 * import { buildSignedOrder } from "polypure/order-builder";
 *
 * const order = await buildSignedOrder({
 *   signer: account,
 *   tokenId: "0x...",
 *   price: 0.65,
 *   size: 100,
 *   side: "BUY",
 *   tickSize: "0.01",
 * });
 * ```
 */

// Constants
export {
  EXCHANGE_ADDRESS,
  NEG_RISK_EXCHANGE_ADDRESS,
  NEG_RISK_ADAPTER_ADDRESS,
  COLLATERAL_TOKEN,
  CONDITIONAL_TOKEN,
  COLLATERAL_TOKEN_DECIMALS,
  CONDITIONAL_TOKEN_DECIMALS,
  CHAIN_ID,
  ORDER_DOMAIN,
  ORDER_TYPES,
  ROUNDING_CONFIG,
  OrderSide,
  SignatureType,
  DEFAULT_EXPIRATION,
  DEFAULT_FEE_RATE_BPS,
  DEFAULT_TAKER,
  type TickSize,
} from "./constants.js";

// Helpers
export {
  roundDown,
  roundNormal,
  calculateBuyAmounts,
  calculateSellAmounts,
  calculateMarketBuyAmounts,
  alignPrice,
  generateSalt,
} from "./helpers.js";

// Builder
export {
  buildSignedOrder,
  type SignedOrder,
  type BuildOrderParams,
} from "./builder.js";
