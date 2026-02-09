/**
 * Polylib - Polymarket SDK
 * 
 * A thin, zero-dependency (runtime) TypeScript SDK for Polymarket.
 * No logging, no polling, no side effects. You control everything.
 * 
 * @example
 * ```typescript
 * import { PolymarketClient } from "polylib";
 * 
 * const client = new PolymarketClient({
 *   apiKey: "...",
 *   apiSecret: "...",
 *   apiPassphrase: "..."
 * });
 * 
 * const market = await client.getMarket("0x...");
 * const orderbook = await client.getOrderbook(market.market_id, "YES");
 * ```
 */

// ============================================================================
// Core Types
// ============================================================================

export interface Token {
  token_id: string;
  outcome: string;
  price: number;
  winner: boolean;
}

export interface Market {
  market_id: string;
  question: string;
  description: string;
  active: boolean;
  closed: boolean;
  market_slug: string;
  tags: string[];
  confidential_id: string;
  end_date_iso: string;
  game_start_time?: string;
  seconds_delay: number;
  fpmm: string;
  maker_base_fee: number;
  taker_base_fee: number;
  observations: any;
  neg_risk: boolean;
  neg_risk_market_id: string;
  neg_risk_request_id: string;
  icon: string;
  image: string;
  tokens: Token[];
}

export interface OrderbookLevel {
  price: number;
  size: number;
}

export interface Orderbook {
  market: string;
  asset_id: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  hash: string;
}

export type OrderSide = "BUY" | "SELL";
export type OrderType = "GTC" | "FOK" | "IOC";
export type OrderStatus = "PENDING" | "OPEN" | "FILLED" | "PARTIAL" | "CANCELLED" | "FAILED";

export interface Order {
  id: string;
  market: string;
  side: OrderSide;
  size: number;
  price: number;
  type: OrderType;
  status: OrderStatus;
  filled_size: number;
  remaining_size: number;
  created_at: string;
  updated_at: string;
}

export interface OrderRequest {
  market: string;
  side: OrderSide;
  outcome?: string;  // e.g., "YES", "Over 12.5°C", etc.
  tokenId?: string;  // direct token ID
  amount: number;
  price: number;
  type?: OrderType;
}

export interface OrderResponse {
  order_id: string;
  status: string;
  filled_size: number;
  remaining_size: number;
}

export interface Trade {
  id: string;
  market: string;
  asset_id: string;
  side: OrderSide;
  size: string;
  price: string;
  status: string;
  match_time: string;
  outcome: string;
  transaction_hash: string;
  trader_side: "TAKER" | "MAKER";
}

export interface BalanceAllowance {
  balance: string;
  allowances: Record<string, string>;
}

export interface UserEarning {
  date: string;
  condition_id: string;
  asset_address: string;
  maker_address: string;
  earnings: number;
}

export interface TotalUserEarning {
  date: string;
  asset_address: string;
  maker_address: string;
  earnings: number;
  asset_rate: number;
}

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

export interface AuthConfig {
  apiKey: string;
  apiSecret: string;
  apiPassphrase: string;
  proxyAddress?: string;
}

export interface ClientOptions extends AuthConfig {
  signer?: any;
  rpcUrl?: string;
  signatureType?: number;
  funderAddress?: string;
  baseUrl?: string;
}

// ============================================================================
// Gamma API Types (for market discovery)
// ============================================================================

export interface GammaEvent {
  id: string;
  title: string;
  slug: string;
  description?: string;
  endDate: string;
  closed: boolean;
  active?: boolean;
  seriesSlug?: string;
  icon?: string;
  markets: GammaMarket[];
}

export interface GammaMarket {
  conditionId: string;
  question: string;
  slug: string;
  description?: string;
  endDate: string;
  clobTokenIds: string | null;
  outcomes?: string;
  outcomePrices?: Record<string, string>;
  active: boolean;
  closed: boolean;
  acceptingOrders?: boolean;
  eventStartTime?: string | null;
  tags?: string[];
  negRiskMarketId?: string;
}

export interface Series {
  id: string;
  title: string;
  slug: string;
  description?: string;
  endDate: string;
  closed: boolean;
  markets: MarketInfo[];
}

export interface MarketInfo {
  conditionId: string;
  question: string;
  slug: string;
  description?: string;
  endDate: string;
  outcomes: OutcomeInfo[];
  active: boolean;
  closed: boolean;
  tags: string[];
}

export interface OutcomeInfo {
  tokenId: string;
  name: string;
  price?: number;
}

// ============================================================================
// Constants
// ============================================================================

export const POLYMARKET_CLOB_HOST = "https://clob.polymarket.com";
export const POLYMARKET_WS_URL = "wss://ws-subscriptions-clob.polymarket.com";
export const GAMMA_API_BASE = "https://gamma-api.polymarket.com";

// ============================================================================
// Errors
// ============================================================================

export class PolymarketError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "PolymarketError";
  }
}

export class AuthenticationError extends PolymarketError {
  constructor(message = "Authentication failed") {
    super(message, "AUTH_ERROR", 401);
    this.name = "AuthenticationError";
  }
}

export class ValidationError extends PolymarketError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}

// ============================================================================
// HTTP Client
// ============================================================================

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

async function httpRequest<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new PolymarketError(
      `HTTP ${response.status}: ${text}`,
      "HTTP_ERROR",
      response.status
    );
  }

  return response.json() as Promise<T>;
}

// ============================================================================
// CLOB Client
// ============================================================================

import {
  ClobClient,
  Chain,
  OrderType as ClobOrderType,
  Side as ClobSide,
  AssetType,
} from "@polymarket/clob-client";

export class PolymarketClient {
  private sdk: ClobClient;
  private signer?: any;
  private baseUrl: string;
  private auth: AuthConfig;

  constructor(options: ClientOptions) {
    this.auth = options;
    this.signer = options.signer;
    this.baseUrl = options.baseUrl || POLYMARKET_CLOB_HOST;

    this.sdk = new ClobClient(
      this.baseUrl,
      Chain.POLYGON,
      options.signer,
      {
        key: options.apiKey,
        secret: options.apiSecret,
        passphrase: options.apiPassphrase,
      },
      options.signatureType,
      options.funderAddress
    );
  }

  // ========================================================================
  // Markets
  // ========================================================================

  /**
   * Get market by condition ID
   */
  async getMarket(conditionId: string): Promise<Market> {
    return this.sdk.getMarket(conditionId);
  }

  /**
   * Get markets (returns first page)
   */
  async getMarkets(): Promise<Market[]> {
    const page = await this.sdk.getMarkets();
    return (page as any).markets ?? (page as any).data ?? page ?? [];
  }

  /**
   * Search markets by query (client-side filter)
   */
  async searchMarkets(query: string, limit = 20): Promise<Market[]> {
    const markets = await this.getMarkets();
    const q = query.toLowerCase();
    return markets
      .filter((m) =>
        [m.question, m.description, m.market_slug]
          .filter(Boolean)
          .some((s) => String(s).toLowerCase().includes(q))
      )
      .slice(0, limit);
  }

  // ========================================================================
  // Orderbook
  // ========================================================================

  /**
   * Get orderbook for a market outcome
   */
  async getOrderbook(marketId: string, outcome: string): Promise<Orderbook> {
    const market = await this.getMarket(marketId);
    
    const token = market.tokens.find((t) =>
      t.outcome.toUpperCase() === outcome.toUpperCase()
    ) ?? market.tokens[0];

    if (!token?.token_id) {
      throw new ValidationError(`No token found for outcome: ${outcome}`);
    }

    const ob = await this.sdk.getOrderBook(token.token_id);
    const hash = await this.sdk.getOrderBookHash(ob);

    return {
      market: marketId,
      asset_id: token.token_id,
      bids: ob.bids.map((b: any) => ({
        price: parseFloat(b.price),
        size: parseFloat(b.size),
      })),
      asks: ob.asks.map((a: any) => ({
        price: parseFloat(a.price),
        size: parseFloat(a.size),
      })),
      hash,
    };
  }

  /**
   * Get orderbook by token ID directly
   */
  async getOrderbookByTokenId(tokenId: string): Promise<Orderbook> {
    const ob = await this.sdk.getOrderBook(tokenId);
    const hash = await this.sdk.getOrderBookHash(ob);

    return {
      market: "",
      asset_id: tokenId,
      bids: ob.bids.map((b: any) => ({
        price: parseFloat(b.price),
        size: parseFloat(b.size),
      })),
      asks: ob.asks.map((a: any) => ({
        price: parseFloat(a.price),
        size: parseFloat(a.size),
      })),
      hash,
    };
  }

  // ========================================================================
  // Orders
  // ========================================================================

  /**
   * Place an order
   */
  async placeOrder(request: OrderRequest): Promise<OrderResponse> {
    // Resolve token ID
    let tokenId = request.tokenId;
    
    if (!tokenId && request.outcome) {
      const market = await this.getMarket(request.market);
      const token = market.tokens.find((t) =>
        t.outcome.toUpperCase() === request.outcome!.toUpperCase()
      );
      
      if (!token) {
        throw new ValidationError(
          `Outcome "${request.outcome}" not found. Available: ${market.tokens.map(t => t.outcome).join(", ")}`
        );
      }
      
      tokenId = token.token_id;
    }

    if (!tokenId) {
      throw new ValidationError("Either outcome or tokenId must be provided");
    }

    // Build order
    const orderType =
      request.type === "GTC" ? ClobOrderType.GTC :
      request.type === "IOC" ? ClobOrderType.GTD :
      ClobOrderType.FOK;

    const userOrder = {
      tokenID: tokenId,
      price: request.price,
      size: request.amount,
      side: request.side === "BUY" ? ClobSide.BUY : ClobSide.SELL,
    };

    const res = await this.sdk.createAndPostOrder(userOrder, {}, orderType as any);

    const orderId = (res as any)?.orderID ?? (res as any)?.orderId ?? (res as any)?.id;
    const errorMsg = (res as any)?.errorMsg ?? (res as any)?.error;

    if (errorMsg) {
      throw new PolymarketError(String(errorMsg), "ORDER_REJECTED");
    }

    if (!orderId) {
      throw new PolymarketError("Order response missing ID", "INVALID_RESPONSE");
    }

    return {
      order_id: String(orderId),
      status: (res as any)?.status ?? "PENDING",
      filled_size: parseFloat((res as any)?.filledSize ?? "0"),
      remaining_size: request.amount - parseFloat((res as any)?.filledSize ?? "0"),
    };
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    await this.sdk.cancelOrder({ orderID: orderId });
  }

  /**
   * Get open orders
   */
  async getOrders(): Promise<any[]> {
    return this.sdk.getOpenOrders({});
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string): Promise<any> {
    return this.sdk.getOrder(orderId);
  }

  // ========================================================================
  // Trades
  // ========================================================================

  /**
   * Get user trades
   */
  async getTrades(params?: { asset_id?: string; market?: string }): Promise<Trade[]> {
    const result = await this.sdk.getTrades(params || {});
    return (result as any)?.data ?? (result as any)?.trades ?? result ?? [];
  }

  // ========================================================================
  // Balance
  // ========================================================================

  /**
   * Get USDC balance and allowance
   */
  async getBalance(): Promise<BalanceAllowance> {
    const result = await this.sdk.getBalanceAllowance({
      asset_type: AssetType.COLLATERAL,
    });
    
    return {
      balance: result.balance,
      allowances: {},
    };
  }

  /**
   * Get USDC balance as number
   */
  async getUSDCBalance(): Promise<number> {
    const { balance } = await this.getBalance();
    return parseFloat(balance) / 1e6;
  }

  /**
   * Update allowance
   */
  async updateAllowance(): Promise<void> {
    await this.sdk.updateBalanceAllowance({
      asset_type: AssetType.COLLATERAL,
    });
  }

  // ========================================================================
  // Profile & Earnings
  // ========================================================================

  /**
   * Get user earnings for a specific date
   * @param date - Date in YYYY-MM-DD format
   */
  async getUserEarnings(date: string): Promise<UserEarning[]> {
    return this.sdk.getEarningsForUserForDay(date);
  }

  /**
   * Get total user earnings for a specific date
   * @param date - Date in YYYY-MM-DD format
   */
  async getTotalUserEarnings(date: string): Promise<TotalUserEarning[]> {
    return this.sdk.getTotalEarningsForUserForDay(date);
  }

  /**
   * Get user earnings with market details
   * @param date - Date in YYYY-MM-DD format
   * @param options - Optional query parameters
   */
  async getUserRewardsEarnings(
    date: string,
    options?: {
      order_by?: string;
      position?: string;
      no_competition?: boolean;
    }
  ): Promise<UserRewardsEarning[]> {
    return this.sdk.getUserEarningsAndMarketsConfig(
      date,
      options?.order_by,
      options?.position,
      options?.no_competition
    );
  }

  // ========================================================================
  // Authentication
  // ========================================================================

  /**
   * Derive API key from signer
   */
  async deriveApiKey(): Promise<AuthConfig> {
    const derived = await this.sdk.deriveApiKey();
    return {
      apiKey: derived.key,
      apiSecret: derived.secret,
      apiPassphrase: derived.passphrase,
    };
  }
}

// ============================================================================
// Gamma API Functions (Market Discovery)
// ============================================================================

/**
 * Fetch series by slug
 */
export async function getSeries(slug: string): Promise<Series | null> {
  const url = `${GAMMA_API_BASE}/events?slug=${encodeURIComponent(slug)}`;
  
  try {
    const events = await httpRequest<GammaEvent[]>(url);
    if (!events?.length) return null;
    
    return parseSeries(events[0]);
  } catch {
    return null;
  }
}

/**
 * Search for series
 */
export async function searchSeries(
  query: string,
  options: { limit?: number; active?: boolean } = {}
): Promise<Series[]> {
  const { limit = 10, active = true } = options;
  
  const params = new URLSearchParams({
    search: query,
    limit: String(limit),
    closed: "false",
  });
  
  if (active) params.set("active", "true");
  
  const url = `${GAMMA_API_BASE}/events?${params}`;
  
  try {
    const events = await httpRequest<GammaEvent[]>(url);
    return events.map(parseSeries);
  } catch {
    return [];
  }
}

/**
 * Parse Gamma event to Series
 */
function parseSeries(event: GammaEvent): Series {
  return {
    id: event.id,
    title: event.title,
    slug: event.slug,
    description: event.description,
    endDate: event.endDate,
    closed: event.closed,
    markets: event.markets.map(parseMarketInfo).filter(Boolean) as MarketInfo[],
  };
}

/**
 * Parse Gamma market to MarketInfo
 */
function parseMarketInfo(market: GammaMarket): MarketInfo | null {
  const tokenIds = parseTokenIds(market.clobTokenIds);
  if (!tokenIds.length) return null;

  const outcomeNames = parseOutcomes(market.outcomes);
  
  const outcomes: OutcomeInfo[] = tokenIds.map((tokenId, i) => ({
    tokenId,
    name: outcomeNames[i] || `Outcome ${i + 1}`,
    price: market.outcomePrices?.[outcomeNames[i]]
      ? parseFloat(market.outcomePrices[outcomeNames[i]])
      : undefined,
  }));

  return {
    conditionId: market.conditionId,
    question: market.question,
    slug: market.slug,
    description: market.description,
    endDate: market.endDate,
    outcomes,
    active: market.active,
    closed: market.closed,
    tags: market.tags || [],
  };
}

/**
 * Parse token IDs from JSON string
 */
export function parseTokenIds(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Parse outcomes from JSON string
 */
export function parseOutcomes(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

// ============================================================================
// Order Utilities
// ============================================================================

/**
 * Get tick size for a price
 * Default: 0.01, Near extremes (>0.96 or <0.04): 0.001
 */
export function getTickSize(price: number): number {
  return price > 0.96 || price < 0.04 ? 0.001 : 0.01;
}

/**
 * Align price to valid tick
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
 * Normalize order params
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

// ============================================================================
// Orderbook Utilities
// ============================================================================

/**
 * Get best bid/ask from orderbook
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
 * Calculate spread
 */
export function calculateSpread(orderbook: Orderbook): number {
  const { spread } = getBestPrices(orderbook);
  return spread;
}

/**
 * Calculate depth
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
 * Check for arbitrage opportunity
 */
export function isArbitrage(orderbook: Orderbook, threshold = 0.98): boolean {
  const spread = calculateSpread(orderbook);
  return spread < threshold;
}

// ============================================================================
// Version
// ============================================================================

export const VERSION = "0.2.0";
