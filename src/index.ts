/**
 * Polypure - Polymarket SDK
 *
 * A thin, zero-dependency (runtime) TypeScript SDK for Polymarket.
 * No logging, no polling, no side effects. You control everything.
 *
 * This barrel file re-exports the entire public API from its
 * individual modules. All imports from "polypure" resolve here.
 *
 * @example
 * ```typescript
 * import { createClientFromPrivateKey } from "polypure";
 *
 * const client = await createClientFromPrivateKey({
 *   privateKey: process.env.POLYMARKET_PRIVATE_KEY!,
 *   funderAddress: process.env.POLYMARKET_FUNDER_ADDRESS!,
 *   signatureType: 1, // 0 = Browser Wallet, 1 = Magic/Email (default)
 * });
 *
 * const market = await client.getMarket("0x...");
 * const orderbook = await client.getOrderbook(market.market_id, "YES");
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

// ── Client ──────────────────────────────────────────────────────────────────
export {
  PolymarketClient,
  createClientFromPrivateKey,
  createReadOnlyClient,
} from "./client.js";

// ── Gamma API (market discovery) ────────────────────────────────────────────
export {
  getSeries,
  searchSeries,
  parseTokenIds,
  parseOutcomes,
} from "./gamma.js";

// ── Profile Queries (public, no auth required) ──────────────────────────────
// These also work in browser environments
export {
  getProfile,
  getUserPositions,
  getMarketPositions,
  getAllUserPositions,
  getUserTrades,
  getAllTradesForUser,
} from "./profiles.js";

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
export { log, logger } from "./logger.js";
export type { Logger } from "./logger.js";

// ── Auth Module ─────────────────────────────────────────────────────────────
export {
  signHmac,
  buildL2Message,
  signClobAuth,
  generateNonce,
  getTimestamp,
  CLOB_AUTH_DOMAIN,
  CLOB_AUTH_TYPES,
  createL1Headers,
  createL2Headers,
  deriveApiKey,
  createApiKey,
  createOrDeriveApiKey,
  type ApiCredentials,
  type L1Headers,
  type L2Headers,
} from "./auth/index.js";

// ── Order Builder Module ────────────────────────────────────────────────────
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
  SignatureType as OrderSignatureType,
  DEFAULT_EXPIRATION,
  DEFAULT_FEE_RATE_BPS,
  DEFAULT_TAKER,
  roundDown,
  roundNormal,
  calculateBuyAmounts,
  calculateSellAmounts,
  calculateMarketBuyAmounts,
  generateSalt,
  buildSignedOrder,
  type TickSize,
  type SignedOrder,
  type BuildOrderParams,
} from "./order-builder/index.js";
