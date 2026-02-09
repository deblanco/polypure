/**
 * Polypure - Polymarket SDK
 *
 * A thin, zero-dependency (runtime) TypeScript SDK for Polymarket.
 * No logging, no polling, no side effects. You control everything.
 *
 * @example
 * ```typescript
 * import { PolymarketClient } from "polypure";
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

// ============================================================================
// Position Types
// ============================================================================

export interface Position {
  order_id?: string;
  asset_id: string;
  side: OrderSide;
  size: string;
  price: string;
  original_size?: string;
  original_price?: string;
  filled_size?: string;
  remaining_size?: string;
  status: string;
  outcome: string;
  condition_id: string;
  market_question?: string;
  market_slug?: string;
  created_at: string;
  updated_at?: string;
}

export interface PositionSummary {
  condition_id: string;
  question: string;
  market_slug: string;
  positions: Position[];
  total_size: number;
  avg_price: number;
  side: OrderSide;
}

export interface PositionsResponse {
  positions: Position[];
  summary: PositionSummary[];
  next_cursor?: string;
}

// ============================================================================
// Profile Types
// ============================================================================

export interface UserProfile {
  address: string;
  username?: string;
  avatar?: string;
  created_at?: string;
  stats?: ProfileStats;
}

export interface ProfileStats {
  total_trades?: number;
  total_volume?: number;
  total_earnings?: number;
  markets_traded?: number;
  win_rate?: number;
  roi?: number;
}

export interface UserPortfolio {
  address: string;
  positions: Position[];
  total_value: number;
  total_cost: number;
  unrealized_pnl: number;
  markets_count: number;
}

export interface UserTradesOptions {
  address?: string;
  asset_id?: string;
  market?: string;
  next_cursor?: string;
  limit?: number;
}

export interface UserTradesResponse {
  trades: Trade[];
  next_cursor?: string;
  count?: number;
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
  // HTTP Helpers
  // ========================================================================

  /**
   * Build query string from options
   */
  private buildQueryString(options?: { next_cursor?: string; limit?: number }): string {
    if (!options) return "";
    const params = new URLSearchParams();
    if (options.next_cursor) params.set("next_cursor", options.next_cursor);
    if (options.limit) params.set("limit", String(options.limit));
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }

  /**
   * Make an authenticated GET request to the CLOB API
   * Uses the clob-client's internal methods to handle authentication
   */
  private async apiGet<T>(endpoint: string): Promise<T> {
    // Access the protected get method through the sdk instance
    // @ts-expect-error - accessing protected method
    return this.sdk.get(endpoint) as Promise<T>;
  }

  /**
   * Make an authenticated POST request to the CLOB API
   */
  private async apiPost<T>(endpoint: string, body?: unknown): Promise<T> {
    // @ts-expect-error - accessing protected method
    return this.sdk.post(endpoint, { body } as any) as Promise<T>;
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
   * Note: This only returns earnings for the authenticated user's profile
   * @param date - Date in YYYY-MM-DD format
   */
  async getUserEarnings(date: string): Promise<UserEarning[]> {
    return this.sdk.getEarningsForUserForDay(date);
  }

  /**
   * Get total user earnings for a specific date
   * Note: This only returns earnings for the authenticated user's profile
   * @param date - Date in YYYY-MM-DD format
   */
  async getTotalUserEarnings(date: string): Promise<TotalUserEarning[]> {
    return this.sdk.getTotalEarningsForUserForDay(date);
  }

  /**
   * Get user earnings with market details
   * Note: This only returns earnings for the authenticated user's profile
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
  // Current Positions
  // ========================================================================

  /**
   * Get current positions for the authenticated user
   * This returns all open positions across all markets
   */
  async getCurrentPositions(options?: {
    next_cursor?: string;
    limit?: number;
  }): Promise<PositionsResponse> {
    // Note: Positions API endpoint - returns current open positions
    // Using a direct implementation since the clob-client SDK may not expose this
    const response = await this.apiGet<{ positions?: any[]; next_cursor?: string }>(
      `/positions/me${this.buildQueryString(options)}`
    );

    const positions = (response.positions ?? []).map((p: any) => this.normalizePosition(p));
    const summary = this.summarizePositions(positions);

    return {
      positions,
      summary,
      next_cursor: response.next_cursor,
    };
  }

  /**
   * Get current positions for a specific user by wallet address
   * This allows querying positions for other profiles
   * @param address - Wallet address to query positions for
   */
  async getUserPositions(
    address: string,
    options?: {
      next_cursor?: string;
      limit?: number;
    }
  ): Promise<PositionsResponse> {
    const params: Record<string, string> = { address };
    if (options?.next_cursor) params.next_cursor = options.next_cursor;
    if (options?.limit) params.limit = String(options.limit);

    const response = await this.apiGet<{ positions?: any[]; next_cursor?: string }>(
      `/positions?${new URLSearchParams(params)}`
    );

    const positions = (response.positions ?? []).map((p: any) => this.normalizePosition(p));
    const summary = this.summarizePositions(positions);

    return {
      positions,
      summary,
      next_cursor: response.next_cursor,
    };
  }

  /**
   * Get positions for a specific market
   * @param conditionId - Market condition ID
   * @param address - Optional wallet address (defaults to authenticated user)
   */
  async getMarketPositions(
    conditionId: string,
    address?: string,
    options?: {
      next_cursor?: string;
      limit?: number;
    }
  ): Promise<PositionsResponse> {
    const params: Record<string, string> = { market: conditionId };
    if (address) params.address = address;
    if (options?.next_cursor) params.next_cursor = options.next_cursor;
    if (options?.limit) params.limit = String(options.limit);

    const response = await this.apiGet<{ positions?: any[]; next_cursor?: string }>(
      `/positions?${new URLSearchParams(params)}`
    );

    const positions = (response.positions ?? []).map((p: any) => this.normalizePosition(p));
    const summary = this.summarizePositions(positions);

    return {
      positions,
      summary,
      next_cursor: response.next_cursor,
    };
  }

  /**
   * Get all positions (paginated)
   * Fetches all pages of positions automatically
   */
  async getAllPositions(address?: string): Promise<Position[]> {
    const allPositions: Position[] = [];
    let nextCursor: string | undefined;

    do {
      const response = address
        ? await this.getUserPositions(address, { next_cursor: nextCursor, limit: 100 })
        : await this.getCurrentPositions({ next_cursor: nextCursor, limit: 100 });

      allPositions.push(...response.positions);
      nextCursor = response.next_cursor;
    } while (nextCursor);

    return allPositions;
  }

  // ========================================================================
  // Profile Querying
  // ========================================================================

  /**
   * Get profile information for a wallet address
   * This allows querying other user's profiles
   * @param address - Wallet address to query
   */
  async getProfile(address: string): Promise<UserProfile> {
    // Try to get profile data via API
    try {
      const response = await this.apiGet<{ address?: string; username?: string; avatar?: string; created_at?: string }>(
        `/profile/${address}`
      );

      return {
        address: response.address || address,
        username: response.username,
        avatar: response.avatar,
        created_at: response.created_at,
      };
    } catch {
      // If profile endpoint is not available, return minimal profile
      return {
        address,
      };
    }
  }

  /**
   * Get portfolio summary for a wallet address
   * @param address - Wallet address to query (defaults to authenticated user if not provided)
   */
  async getPortfolio(address?: string): Promise<UserPortfolio> {
    const targetAddress = address || await this.getSignerAddress();
    const positions = await this.getUserPositions(targetAddress);

    let totalCost = 0;
    let totalValue = 0;

    for (const pos of positions.positions) {
      const size = parseFloat(pos.size);
      const price = parseFloat(pos.price);
      const cost = size * price;

      // Estimate current value using current market prices
      let currentValue = cost;
      try {
        const orderbook = await this.getOrderbookByTokenId(pos.asset_id);
        const bestPrices = getBestPrices(orderbook);
        const currentPrice = pos.side === "BUY"
          ? (bestPrices.bestAsk || price)
          : (bestPrices.bestBid || price);
        currentValue = size * currentPrice;
      } catch {
        // If we can't get orderbook, use original price
      }

      totalCost += cost;
      totalValue += currentValue;
    }

    return {
      address: targetAddress,
      positions: positions.positions,
      total_value: totalValue,
      total_cost: totalCost,
      unrealized_pnl: totalValue - totalCost,
      markets_count: positions.summary.length,
    };
  }

  /**
   * Get trades for a specific user address
   * @param options - Optional filters and pagination
   */
  async getUserTrades(options?: UserTradesOptions): Promise<UserTradesResponse> {
    const params: { maker_address?: string; asset_id?: string; market?: string } = {};
    if (options?.address) params.maker_address = options.address;
    if (options?.asset_id) params.asset_id = options.asset_id;
    if (options?.market) params.market = options.market;

    const response = await this.sdk.getTrades(params);
    const trades = (response as any)?.data ?? (response as any)?.trades ?? response ?? [];

    return {
      trades,
      next_cursor: (response as any)?.next_cursor,
      count: (response as any)?.count,
    };
  }

  /**
   * Get all trades for a user address (paginated)
   * Fetches all pages automatically
   * @param address - Wallet address to query
   */
  async getAllUserTrades(address: string): Promise<Trade[]> {
    const allTrades: Trade[] = [];
    let nextCursor: string | undefined;

    do {
      const response = await this.sdk.getTradesPaginated(
        { maker_address: address },
        nextCursor
      );
      allTrades.push(...response.trades);
      nextCursor = response.next_cursor;
    } while (nextCursor);

    return allTrades;
  }

  /**
   * Get profile stats from trades
   * Calculates statistics based on historical trade data
   * @param address - Wallet address to analyze
   */
  async getProfileStats(address: string): Promise<ProfileStats> {
    const trades = await this.getAllUserTrades(address);

    const totalTrades = trades.length;
    const totalVolume = trades.reduce((sum, t) => sum + parseFloat(t.size) * parseFloat(t.price), 0);

    // Calculate earnings from filled trades
    const buyTrades = trades.filter(t => t.side === "BUY");
    const sellTrades = trades.filter(t => t.side === "SELL");

    const buyVolume = buyTrades.reduce((sum, t) => sum + parseFloat(t.size) * parseFloat(t.price), 0);
    const sellVolume = sellTrades.reduce((sum, t) => sum + parseFloat(t.size) * parseFloat(t.price), 0);

    const totalEarnings = sellVolume - buyVolume;

    const uniqueMarkets = new Set(trades.map(t => t.market));
    const marketsTraded = uniqueMarkets.size;

    // Calculate win rate (markets where sell price > buy price)
    const marketProfits = new Map<string, { buys: number; sells: number }>();

    for (const trade of trades) {
      if (!marketProfits.has(trade.market)) {
        marketProfits.set(trade.market, { buys: 0, sells: 0 });
      }
      const market = marketProfits.get(trade.market)!;
      const value = parseFloat(trade.size) * parseFloat(trade.price);
      if (trade.side === "BUY") {
        market.buys += value;
      } else {
        market.sells += value;
      }
    }

    let winningMarkets = 0;
    for (const profits of marketProfits.values()) {
      if (profits.sells > profits.buys) {
        winningMarkets++;
      }
    }

    const winRate = marketsTraded > 0 ? (winningMarkets / marketsTraded) * 100 : 0;

    // Calculate ROI
    const roi = buyVolume > 0 ? ((totalEarnings / buyVolume) * 100) : 0;

    return {
      total_trades: totalTrades,
      total_volume: totalVolume,
      total_earnings: totalEarnings,
      markets_traded: marketsTraded,
      win_rate: winRate,
      roi,
    };
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  /**
   * Normalize position data to consistent format
   */
  private normalizePosition(pos: any): Position {
    return {
      order_id: pos.order_id || pos.orderID,
      asset_id: pos.asset_id || pos.tokenID || pos.tokenId,
      side: (pos.side as OrderSide) || "BUY",
      size: pos.size || "0",
      price: pos.price || "0",
      original_size: pos.original_size || pos.originalSize,
      original_price: pos.original_price || pos.originalPrice,
      filled_size: pos.filled_size || pos.filledSize,
      remaining_size: pos.remaining_size || pos.remainingSize,
      status: pos.status || "OPEN",
      outcome: pos.outcome || "",
      condition_id: pos.condition_id || pos.market || "",
      market_question: pos.market_question || pos.question,
      market_slug: pos.market_slug || pos.slug,
      created_at: pos.created_at || pos.createdAt || new Date().toISOString(),
      updated_at: pos.updated_at || pos.updatedAt,
    };
  }

  /**
   * Summarize positions by market
   */
  private summarizePositions(positions: Position[]): PositionSummary[] {
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
      const totalSize = marketPositions.reduce((sum, p) => sum + parseFloat(p.size), 0);
      const avgPrice = marketPositions.reduce((sum, p) => sum + parseFloat(p.price) * parseFloat(p.size), 0) / totalSize;

      summaries.push({
        condition_id: conditionId,
        question: firstPos.market_question || "",
        market_slug: firstPos.market_slug || "",
        positions: marketPositions,
        total_size: totalSize,
        avg_price: avgPrice,
        side,
      });
    }

    return summaries;
  }

  /**
   * Get the signer's wallet address
   */
  private async getSignerAddress(): Promise<string> {
    if (this.signer) {
      return await this.signer.getAddress();
    }
    throw new PolymarketError("Signer required for default address", "NO_SIGNER");
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

export const VERSION = "0.3.0";
