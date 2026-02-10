/**
 * PolymarketClient - Main SDK client for interacting with the Polymarket CLOB API.
 *
 * Wraps the @polymarket/clob-client with a cleaner, typed interface covering
 * markets, orderbooks, orders, trades, positions, profiles, and earnings.
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

import {
  ClobClient,
  Chain,
  OrderType as ClobOrderType,
  Side as ClobSide,
  AssetType,
} from "@polymarket/clob-client";

import { log } from "./logger.js";
import { POLYMARKET_CLOB_HOST } from "./constants.js";
import { PolymarketError, ValidationError } from "./errors.js";
import { getBestPrices } from "./utils/orderbook.js";

import type { ClientOptions, AuthConfig } from "./types/client.js";
import type { Market } from "./types/market.js";
import type { Orderbook } from "./types/orderbook.js";
import type { OrderRequest, OrderResponse, OrderSide } from "./types/order.js";
import type { Trade, UserTradesOptions, UserTradesResponse } from "./types/trade.js";
import type { Position, PositionSummary, PositionsResponse } from "./types/position.js";
import type { BalanceAllowance } from "./types/earnings.js";
import type { UserEarning, TotalUserEarning, UserRewardsEarning } from "./types/earnings.js";
import type { UserProfile, ProfileStats, UserPortfolio } from "./types/profile.js";

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

    log.debug("PolymarketClient initialized", {
      baseUrl: this.baseUrl,
      hasSigner: !!this.signer,
    });
  }

  // ========================================================================
  // HTTP Helpers
  // ========================================================================

  /**
   * Build a query string from pagination options.
   * Returns an empty string when no options are provided.
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
   * Make an authenticated GET request to the CLOB API.
   * Uses the clob-client's internal methods to handle authentication.
   */
  private async apiGet<T>(endpoint: string): Promise<T> {
    // @ts-expect-error - accessing protected method
    return this.sdk.get(endpoint) as Promise<T>;
  }

  /**
   * Make an authenticated POST request to the CLOB API.
   */
  private async apiPost<T>(endpoint: string, body?: unknown): Promise<T> {
    // @ts-expect-error - accessing protected method
    return this.sdk.post(endpoint, { body } as any) as Promise<T>;
  }

  // ========================================================================
  // Markets
  // ========================================================================

  /**
   * Get market by condition ID.
   *
   * @param conditionId - The market's condition ID.
   * @returns Full market data including tokens and metadata.
   */
  async getMarket(conditionId: string): Promise<Market> {
    return this.sdk.getMarket(conditionId);
  }

  /**
   * Get markets (returns the first page).
   *
   * @returns Array of market objects.
   */
  async getMarkets(): Promise<Market[]> {
    const page = await this.sdk.getMarkets();
    return (page as any).markets ?? (page as any).data ?? page ?? [];
  }

  /**
   * Search markets by query (client-side filter).
   *
   * Fetches the first page of markets and filters locally by
   * matching the query against question, description, and slug.
   *
   * @param query - Free-text search string.
   * @param limit - Maximum results to return (default: 20).
   * @returns Filtered array of matching markets.
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
   * Get orderbook for a market outcome.
   *
   * Resolves the outcome name to a token ID, fetches the orderbook,
   * and returns a normalised snapshot with parsed numeric prices/sizes.
   *
   * @param marketId - The market's condition ID.
   * @param outcome - Outcome name (e.g., "YES", "NO").
   * @returns Normalised orderbook snapshot.
   */
  async getOrderbook(marketId: string, outcome: string): Promise<Orderbook> {
    log.debug("Fetching orderbook", { marketId, outcome });

    const market = await this.getMarket(marketId);

    const token =
      market.tokens.find(
        (t) => t.outcome.toUpperCase() === outcome.toUpperCase()
      ) ?? market.tokens[0];

    if (!token?.token_id) {
      const error = `No token found for outcome: ${outcome}`;
      log.error("Orderbook token not found", {
        marketId,
        outcome,
        availableOutcomes: market.tokens.map((t) => t.outcome),
      });
      throw new ValidationError(error);
    }

    const ob = await this.sdk.getOrderBook(token.token_id);
    const hash = await this.sdk.getOrderBookHash(ob);

    const orderbook: Orderbook = {
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

    log.debug("Orderbook fetched", {
      marketId,
      outcome,
      assetId: token.token_id,
      bids: orderbook.bids.length,
      asks: orderbook.asks.length,
    });

    return orderbook;
  }

  /**
   * Get orderbook by token ID directly.
   *
   * Use this when you already have the token ID and
   * don't need to resolve an outcome name.
   *
   * @param tokenId - The token's asset ID.
   * @returns Normalised orderbook snapshot.
   */
  async getOrderbookByTokenId(tokenId: string): Promise<Orderbook> {
    log.debug("Fetching orderbook by token ID", { tokenId });

    const ob = await this.sdk.getOrderBook(tokenId);
    const hash = await this.sdk.getOrderBookHash(ob);

    const orderbook: Orderbook = {
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

    log.debug("Orderbook fetched by token ID", {
      tokenId,
      bids: orderbook.bids.length,
      asks: orderbook.asks.length,
    });

    return orderbook;
  }

  // ========================================================================
  // Orders
  // ========================================================================

  /**
   * Place an order on a market.
   *
   * Resolves the token ID from `outcome` if `tokenId` is not provided,
   * then creates and submits the order via the CLOB.
   *
   * @param request - Order parameters (market, side, amount, price, etc.).
   * @returns Response with the order ID, status, and fill info.
   */
  async placeOrder(request: OrderRequest): Promise<OrderResponse> {
    // Resolve token ID from outcome name if needed
    let tokenId = request.tokenId;

    if (!tokenId && request.outcome) {
      const market = await this.getMarket(request.market);
      const token = market.tokens.find(
        (t) => t.outcome.toUpperCase() === request.outcome!.toUpperCase()
      );

      if (!token) {
        throw new ValidationError(
          `Outcome "${request.outcome}" not found. Available: ${market.tokens.map((t) => t.outcome).join(", ")}`
        );
      }

      tokenId = token.token_id;
    }

    if (!tokenId) {
      throw new ValidationError("Either outcome or tokenId must be provided");
    }

    // Build order with the appropriate time-in-force type
    const orderType =
      request.type === "GTC"
        ? ClobOrderType.GTC
        : request.type === "IOC"
          ? ClobOrderType.GTD
          : ClobOrderType.FOK;

    const userOrder = {
      tokenID: tokenId,
      price: request.price,
      size: request.amount,
      side: request.side === "BUY" ? ClobSide.BUY : ClobSide.SELL,
    };

    log.debug("Placing order", {
      market: request.market,
      side: request.side,
      tokenId,
      amount: request.amount,
      price: request.price,
      type: request.type,
      outcome: request.outcome,
    });

    const res = await this.sdk.createAndPostOrder(userOrder, {}, orderType as any);

    const orderId = (res as any)?.orderID ?? (res as any)?.orderId ?? (res as any)?.id;
    const errorMsg = (res as any)?.errorMsg ?? (res as any)?.error;

    if (errorMsg) {
      log.error("Order rejected", {
        market: request.market,
        side: request.side,
        amount: request.amount,
        price: request.price,
        error: errorMsg,
      });
      throw new PolymarketError(String(errorMsg), "ORDER_REJECTED");
    }

    if (!orderId) {
      log.error("Order response missing ID", { response: res });
      throw new PolymarketError("Order response missing ID", "INVALID_RESPONSE");
    }

    const orderResponse: OrderResponse = {
      order_id: String(orderId),
      status: (res as any)?.status ?? "PENDING",
      filled_size: parseFloat((res as any)?.filledSize ?? "0"),
      remaining_size: request.amount - parseFloat((res as any)?.filledSize ?? "0"),
    };

    log.info("Order placed", {
      orderId: orderResponse.order_id,
      status: orderResponse.status,
      filledSize: orderResponse.filled_size,
      remainingSize: orderResponse.remaining_size,
    });

    return orderResponse;
  }

  /**
   * Cancel an existing order by its ID.
   *
   * @param orderId - The order ID to cancel.
   */
  async cancelOrder(orderId: string): Promise<void> {
    log.debug("Cancelling order", { orderId });
    await this.sdk.cancelOrder({ orderID: orderId });
    log.info("Order cancelled", { orderId });
  }

  /**
   * Get all open orders for the authenticated user.
   *
   * @returns Array of open order objects.
   */
  async getOrders(): Promise<any[]> {
    return this.sdk.getOpenOrders({});
  }

  /**
   * Get details for a specific order.
   *
   * @param orderId - The order ID to look up.
   * @returns Order detail object.
   */
  async getOrder(orderId: string): Promise<any> {
    return this.sdk.getOrder(orderId);
  }

  // ========================================================================
  // Trades
  // ========================================================================

  /**
   * Get trades for the authenticated user.
   *
   * @param params - Optional filters (asset_id, market).
   * @returns Array of trade objects.
   */
  async getTrades(params?: { asset_id?: string; market?: string }): Promise<Trade[]> {
    const result = await this.sdk.getTrades(params || {});
    return (result as any)?.data ?? (result as any)?.trades ?? result ?? [];
  }

  // ========================================================================
  // Balance
  // ========================================================================

  /**
   * Get USDC balance and allowance for the authenticated user.
   *
   * @returns Balance and allowances object.
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
   * Get USDC balance as a human-readable number (divided by 1e6).
   *
   * @returns USDC balance as a float.
   */
  async getUSDCBalance(): Promise<number> {
    const { balance } = await this.getBalance();
    return parseFloat(balance) / 1e6;
  }

  /**
   * Update the collateral allowance for trading.
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
   * Get user earnings for a specific date.
   * Returns earnings for the authenticated user's profile only.
   *
   * @param date - Date in YYYY-MM-DD format.
   * @returns Array of per-condition earnings.
   */
  async getUserEarnings(date: string): Promise<UserEarning[]> {
    return this.sdk.getEarningsForUserForDay(date);
  }

  /**
   * Get total user earnings for a specific date.
   * Returns earnings for the authenticated user's profile only.
   *
   * @param date - Date in YYYY-MM-DD format.
   * @returns Array of aggregated daily earnings.
   */
  async getTotalUserEarnings(date: string): Promise<TotalUserEarning[]> {
    return this.sdk.getTotalEarningsForUserForDay(date);
  }

  /**
   * Get user earnings with associated market details.
   * Returns earnings for the authenticated user's profile only.
   *
   * @param date - Date in YYYY-MM-DD format.
   * @param options - Optional query parameters for ordering/filtering.
   * @returns Array of reward-level earnings with market metadata.
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
    ) as unknown as UserRewardsEarning[];
  }

  // ========================================================================
  // Current Positions
  // ========================================================================

  /**
   * Get current positions for the authenticated user.
   * Returns all open positions across all markets.
   *
   * @param options - Optional pagination (next_cursor, limit).
   * @returns Paginated positions with per-market summaries.
   */
  async getCurrentPositions(options?: {
    next_cursor?: string;
    limit?: number;
  }): Promise<PositionsResponse> {
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
   * Get current positions for a specific user by wallet address.
   *
   * @param address - Wallet address to query positions for.
   * @param options - Optional pagination (next_cursor, limit).
   * @returns Paginated positions with per-market summaries.
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
   * Get positions for a specific market.
   *
   * @param conditionId - Market condition ID.
   * @param address - Optional wallet address (defaults to authenticated user).
   * @param options - Optional pagination (next_cursor, limit).
   * @returns Paginated positions with per-market summaries.
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
   * Get all positions (auto-paginated).
   * Fetches every page until no more cursors remain.
   *
   * @param address - Optional wallet address (defaults to authenticated user).
   * @returns All positions across all pages.
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
   * Get profile information for a wallet address.
   *
   * @param address - Wallet address to query.
   * @returns User profile (minimal if the endpoint is unavailable).
   */
  async getProfile(address: string): Promise<UserProfile> {
    try {
      const response = await this.apiGet<{
        address?: string;
        username?: string;
        avatar?: string;
        created_at?: string;
      }>(`/profile/${address}`);

      return {
        address: response.address || address,
        username: response.username,
        avatar: response.avatar,
        created_at: response.created_at,
      };
    } catch {
      // If profile endpoint is not available, return minimal profile
      return { address };
    }
  }

  /**
   * Get portfolio summary for a wallet address.
   * Calculates total value, cost, and unrealised PnL from positions and orderbooks.
   *
   * @param address - Wallet address (defaults to authenticated user).
   * @returns Portfolio summary with positions and PnL metrics.
   */
  async getPortfolio(address?: string): Promise<UserPortfolio> {
    const targetAddress = address || (await this.getSignerAddress());
    const positions = await this.getUserPositions(targetAddress);

    let totalCost = 0;
    let totalValue = 0;

    for (const pos of positions.positions) {
      const size = parseFloat(pos.size);
      const price = parseFloat(pos.price);
      const cost = size * price;

      // Estimate current value using live orderbook prices
      let currentValue = cost;
      try {
        const orderbook = await this.getOrderbookByTokenId(pos.asset_id);
        const bestPrices = getBestPrices(orderbook);
        const currentPrice =
          pos.side === "BUY"
            ? bestPrices.bestAsk || price
            : bestPrices.bestBid || price;
        currentValue = size * currentPrice;
      } catch {
        // If we can't get orderbook, fall back to original price
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
   * Get trades for a specific user address.
   *
   * @param options - Optional filters (address, asset_id, market) and pagination.
   * @returns Paginated trade response.
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
   * Get all trades for a user address (auto-paginated).
   * Fetches every page until no more cursors remain.
   *
   * @param address - Wallet address to query.
   * @returns All trades across all pages.
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
   * Calculate profile statistics from historical trade data.
   *
   * Fetches all trades for the given address and computes totals,
   * volume, earnings, win rate, and ROI.
   *
   * @param address - Wallet address to analyze.
   * @returns Computed trading statistics.
   */
  async getProfileStats(address: string): Promise<ProfileStats> {
    const trades = await this.getAllUserTrades(address);

    const totalTrades = trades.length;
    const totalVolume = trades.reduce(
      (sum, t) => sum + parseFloat(t.size) * parseFloat(t.price),
      0
    );

    // Separate buy/sell volume for earnings calculation
    const buyTrades = trades.filter((t) => t.side === "BUY");
    const sellTrades = trades.filter((t) => t.side === "SELL");

    const buyVolume = buyTrades.reduce(
      (sum, t) => sum + parseFloat(t.size) * parseFloat(t.price),
      0
    );
    const sellVolume = sellTrades.reduce(
      (sum, t) => sum + parseFloat(t.size) * parseFloat(t.price),
      0
    );

    const totalEarnings = sellVolume - buyVolume;

    const uniqueMarkets = new Set(trades.map((t) => t.market));
    const marketsTraded = uniqueMarkets.size;

    // Calculate win rate: proportion of markets where sells exceed buys
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

    // Calculate ROI as percentage of earnings relative to buy volume
    const roi = buyVolume > 0 ? (totalEarnings / buyVolume) * 100 : 0;

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
  // Helper Methods (private)
  // ========================================================================

  /**
   * Normalise raw position data to a consistent Position shape.
   * Handles varying field names from different API responses.
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
   * Summarise positions by market, computing totals and averages.
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
      const avgPrice =
        marketPositions.reduce((sum, p) => sum + parseFloat(p.price) * parseFloat(p.size), 0) /
        totalSize;

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
   * Get the signer's wallet address.
   * Throws if no signer is configured.
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
   * Derive a new API key from the configured signer.
   *
   * @returns Fresh API credentials (key, secret, passphrase).
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
