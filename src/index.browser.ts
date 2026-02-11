/**
 * Polypure - Browser-compatible SDK
 *
 * A browser-compatible subset of the Polypure SDK.
 * Excludes Node.js-only features like order placement and authenticated endpoints.
 *
 * For full functionality (orders, authentication), use the Node.js build.
 *
 * @example
 * ```typescript
 * import { getSeries, searchSeries } from "polypure/browser";
 *
 * const series = await getSeries();
 * ```
 */

// ── Types ───────────────────────────────────────────────────────────────────
export type {
  Token,
  Market,
  GammaEvent,
  GammaMarket,
  Series,
  MarketInfo,
  OutcomeInfo,
} from "./types/market.js";

export type {
  OrderSide,
  OrderType,
  OrderStatus,
  Order,
  OrderRequest,
  OrderResponse,
} from "./types/order.js";

export type {
  Trade,
  UserTradesOptions,
  UserTradesResponse,
} from "./types/trade.js";

export type {
  Position,
  PositionSummary,
  PositionsResponse,
} from "./types/position.js";

export type {
  UserProfile,
  ProfileStats,
  UserPortfolio,
} from "./types/profile.js";

export type {
  BalanceAllowance,
  UserEarning,
  TotalUserEarning,
  UserRewardsEarning,
} from "./types/earnings.js";

export type {
  PrivateKeyConfig,
  ClientOptions,
  RequestOptions,
} from "./types/client.js";

export type {
  OrderbookLevel,
  Orderbook,
} from "./types/orderbook.js";

// ── Constants ───────────────────────────────────────────────────────────────
export {
  POLYMARKET_CLOB_HOST,
  POLYMARKET_WS_URL,
  GAMMA_API_BASE,
  DATA_API_BASE,
  VERSION,
} from "./constants.js";

// ── Errors ──────────────────────────────────────────────────────────────────
export {
  PolymarketError,
  AuthenticationError,
  ValidationError,
} from "./errors.js";

// ── Gamma API (market discovery) ────────────────────────────────────────────
export {
  getSeries,
  searchSeries,
  parseTokenIds,
  parseOutcomes,
} from "./gamma.js";

// ── Utilities ───────────────────────────────────────────────────────────────
export {
  getTickSize,
  alignPrice,
  normalizeOrder,
} from "./utils/order.js";

export {
  getBestPrices,
  calculateSpread,
  calculateDepth,
  isArbitrage,
} from "./utils/orderbook.js";

// ── Logger ──────────────────────────────────────────────────────────────────
export { log, logger } from "./logger.browser.js";
export type { Logger } from "./logger.browser.js";
