#!/usr/bin/env node

/**
 * Polypure MCP Server
 *
 * Model Context Protocol server that exposes the full Polypure SDK
 * as tools for AI agents. Supports market discovery, orderbook analysis,
 * portfolio tracking, and order management on Polymarket.
 *
 * Install and run:
 *   npx polypure-mcp
 *
 * Or configure in Claude Desktop / Claude Code:
 *   {
 *     "mcpServers": {
 *       "polypure": {
 *         "command": "npx",
 *         "args": ["polypure-mcp"],
 *         "env": {
 *           "POLYMARKET_PRIVATE_KEY": "0x...",
 *           "POLYMARKET_FUNDER_ADDRESS": "0x...",
 *           "POLYMARKET_SIGNATURE_TYPE": "1"
 *         }
 *       }
 *     }
 *   }
 *
 * Environment Variables:
 *   POLYMARKET_PRIVATE_KEY     - Your wallet private key (required for trading)
 *   POLYMARKET_FUNDER_ADDRESS  - Your Polymarket profile address (required for trading)
 *   POLYMARKET_SIGNATURE_TYPE  - 0 = Browser Wallet, 1 = Magic/Email (default: 1)
 */

// Silence Winston logger BEFORE any imports -- stdout is reserved for MCP protocol.
// Must happen before the logger module initializes.
process.env.LOG_LEVEL = "silent";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { PolymarketClient, createClientFromPrivateKey } from "./client.js";
import { getSeries, searchSeries } from "./gamma.js";
import { getBestPrices, calculateSpread, calculateDepth, isArbitrage } from "./utils/orderbook.js";
import { VERSION } from "./constants.js";

import type { PrivateKeyConfig } from "./types/client.js";

// ============================================================================
// Environment & Client Setup
// ============================================================================

/**
 * Read private key credentials from environment variables.
 * Returns null if no credentials are configured (read-only mode).
 */
function getPrivateKeyConfig(): PrivateKeyConfig | null {
  const privateKey = process.env.POLYMARKET_PRIVATE_KEY;
  const funderAddress = process.env.POLYMARKET_FUNDER_ADDRESS;

  if (!privateKey || !funderAddress) {
    return null;
  }

  const signatureType = parseInt(process.env.POLYMARKET_SIGNATURE_TYPE || "1") as 0 | 1;

  return { privateKey: privateKey as `0x${string}`, funderAddress, signatureType };
}

/**
 * Create authenticated client, or throw with a clear message.
 */
function requireClient(client: PolymarketClient | null): PolymarketClient {
  if (!client) {
    throw new Error(
      "Authentication required. Set POLYMARKET_PRIVATE_KEY and POLYMARKET_FUNDER_ADDRESS environment variables."
    );
  }
  return client;
}

/**
 * Wrap a tool handler to catch errors and return MCP-formatted error responses.
 */
function toolResult(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

// ============================================================================
// Server Initialization
// ============================================================================

let client: PolymarketClient | null = null;

/**
 * Initialize the client from private key config.
 * Called during server startup.
 */
async function initializeClient(): Promise<void> {
  const config = getPrivateKeyConfig();
  if (config) {
    client = await createClientFromPrivateKey(config);
  }
}

const server = new McpServer({
  name: "polypure",
  version: VERSION,
});

// ============================================================================
// Market Discovery Tools (no auth required -- uses Gamma API)
// ============================================================================

server.tool(
  "search_series",
  "Search Polymarket prediction markets/events by text query. Returns series with their markets and current outcome prices. No authentication required.",
  {
    query: z.string().describe("Search text (e.g., 'presidential election', 'bitcoin price')"),
    limit: z.number().optional().default(10).describe("Maximum results to return (default: 10)"),
    active: z.boolean().optional().default(true).describe("Only return active markets (default: true)"),
  },
  async ({ query, limit, active }) => {
    try {
      const results = await searchSeries(query, { limit, active });
      if (!results.length) {
        return toolResult(`No markets found matching "${query}".`);
      }
      return toolResult(JSON.stringify(results, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.tool(
  "get_series",
  "Get a specific Polymarket series/event by its URL slug. Returns the full event with all markets and outcomes. No authentication required.",
  {
    slug: z.string().describe("URL slug of the series (e.g., 'presidential-election-winner-2024')"),
  },
  async ({ slug }) => {
    try {
      const series = await getSeries(slug);
      if (!series) {
        return toolResult(`Series not found: "${slug}".`);
      }
      return toolResult(JSON.stringify(series, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.tool(
  "get_market",
  "Get detailed market data by condition ID. Returns tokens, prices, fees, and metadata. Requires authentication.",
  {
    conditionId: z.string().describe("Market condition ID (hex string starting with 0x)"),
  },
  async ({ conditionId }) => {
    try {
      const c = requireClient(client);
      const market = await c.getMarket(conditionId);
      return toolResult(JSON.stringify(market, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.tool(
  "get_markets",
  "List the first page of Polymarket markets. Returns an array of market objects with questions, prices, and metadata. Requires authentication.",
  {},
  async () => {
    try {
      const c = requireClient(client);
      const markets = await c.getMarkets();
      return toolResult(JSON.stringify(markets, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.tool(
  "search_markets",
  "Search markets by text query (client-side filter on question, description, slug). Requires authentication.",
  {
    query: z.string().describe("Search text to match against market questions and descriptions"),
    limit: z.number().optional().default(20).describe("Maximum results to return (default: 20)"),
  },
  async ({ query, limit }) => {
    try {
      const c = requireClient(client);
      const markets = await c.searchMarkets(query, limit);
      if (!markets.length) {
        return toolResult(`No markets found matching "${query}".`);
      }
      return toolResult(JSON.stringify(markets, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

// ============================================================================
// Orderbook Tools
// ============================================================================

server.tool(
  "get_orderbook",
  "Get the orderbook for a market outcome. Shows bid/ask levels with prices and sizes, plus best prices and spread. Requires authentication.",
  {
    marketId: z.string().describe("Market condition ID"),
    outcome: z.string().describe("Outcome name (e.g., 'YES', 'NO', 'Over 12.5')"),
  },
  async ({ marketId, outcome }) => {
    try {
      const c = requireClient(client);
      const orderbook = await c.getOrderbook(marketId, outcome);
      const bestPrices = getBestPrices(orderbook);
      const spread = calculateSpread(orderbook);
      const depth = calculateDepth(orderbook);
      const arbitrage = isArbitrage(orderbook);

      const result = {
        orderbook,
        analysis: {
          bestBid: bestPrices.bestBid,
          bestAsk: bestPrices.bestAsk,
          spread,
          bidDepth: depth.bidDepth,
          askDepth: depth.askDepth,
          arbitrageOpportunity: arbitrage,
        },
      };

      return toolResult(JSON.stringify(result, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.tool(
  "get_orderbook_by_token",
  "Get the orderbook by token ID directly. Use when you already have the token ID. Requires authentication.",
  {
    tokenId: z.string().describe("Token asset ID"),
  },
  async ({ tokenId }) => {
    try {
      const c = requireClient(client);
      const orderbook = await c.getOrderbookByTokenId(tokenId);
      const bestPrices = getBestPrices(orderbook);
      const spread = calculateSpread(orderbook);
      const depth = calculateDepth(orderbook);

      const result = {
        orderbook,
        analysis: {
          bestBid: bestPrices.bestBid,
          bestAsk: bestPrices.bestAsk,
          spread,
          bidDepth: depth.bidDepth,
          askDepth: depth.askDepth,
        },
      };

      return toolResult(JSON.stringify(result, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

// ============================================================================
// Account & Position Tools (auth required)
// ============================================================================

server.tool(
  "get_balance",
  "Get the authenticated user's USDC balance on Polymarket. Returns both raw and human-readable balance. Requires authentication.",
  {},
  async () => {
    try {
      const c = requireClient(client);
      const balance = await c.getBalance();
      const usdcBalance = await c.getUSDCBalance();

      return toolResult(JSON.stringify({
        raw: balance,
        usdc: usdcBalance,
        formatted: `$${usdcBalance.toFixed(2)} USDC`,
      }, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.tool(
  "get_positions",
  "Get current open positions for the authenticated user. Returns positions grouped by market with size, price, and summary. Requires authentication.",
  {
    limit: z.number().optional().default(100).describe("Maximum positions to return (default: 100)"),
  },
  async ({ limit }) => {
    try {
      const c = requireClient(client);
      const positions = await c.getCurrentPositions({ limit });
      return toolResult(JSON.stringify(positions, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.tool(
  "get_user_positions",
  "Get positions for a specific wallet address. Returns positions grouped by market. Requires authentication.",
  {
    address: z.string().describe("Wallet address to query"),
    limit: z.number().optional().default(100).describe("Maximum positions to return (default: 100)"),
  },
  async ({ address, limit }) => {
    try {
      const c = requireClient(client);
      const positions = await c.getUserPositions(address, { limit });
      return toolResult(JSON.stringify(positions, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.tool(
  "get_market_positions",
  "Get positions for a specific market. Optionally filter by wallet address. Requires authentication.",
  {
    conditionId: z.string().describe("Market condition ID"),
    address: z.string().optional().describe("Optional wallet address filter"),
  },
  async ({ conditionId, address }) => {
    try {
      const c = requireClient(client);
      const positions = await c.getMarketPositions(conditionId, address);
      return toolResult(JSON.stringify(positions, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.tool(
  "get_portfolio",
  "Get portfolio summary with total value, cost basis, and unrealized PnL. Calculates current value from live orderbook prices. Requires authentication.",
  {
    address: z.string().optional().describe("Wallet address (defaults to authenticated user)"),
  },
  async ({ address }) => {
    try {
      const c = requireClient(client);
      const portfolio = await c.getPortfolio(address);

      const result = {
        ...portfolio,
        formatted: {
          totalValue: `$${portfolio.total_value.toFixed(2)}`,
          totalCost: `$${portfolio.total_cost.toFixed(2)}`,
          unrealizedPnl: `${portfolio.unrealized_pnl >= 0 ? "+" : ""}$${portfolio.unrealized_pnl.toFixed(2)}`,
          marketsCount: portfolio.markets_count,
        },
      };

      return toolResult(JSON.stringify(result, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.tool(
  "get_profile",
  "Get user profile information for a wallet address. Requires authentication.",
  {
    address: z.string().describe("Wallet address to query"),
  },
  async ({ address }) => {
    try {
      const c = requireClient(client);
      const profile = await c.getProfile(address);
      return toolResult(JSON.stringify(profile, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.tool(
  "get_trades",
  "Get trade history for the authenticated user. Optionally filter by asset or market. Requires authentication.",
  {
    asset_id: z.string().optional().describe("Filter by asset/token ID"),
    market: z.string().optional().describe("Filter by market condition ID"),
  },
  async ({ asset_id, market }) => {
    try {
      const c = requireClient(client);
      const params: { asset_id?: string; market?: string } = {};
      if (asset_id) params.asset_id = asset_id;
      if (market) params.market = market;

      const trades = await c.getTrades(Object.keys(params).length ? params : undefined);
      return toolResult(JSON.stringify(trades, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.tool(
  "get_earnings",
  "Get earnings for a specific date. Returns per-condition earnings breakdown. Requires authentication.",
  {
    date: z.string().describe("Date in YYYY-MM-DD format"),
  },
  async ({ date }) => {
    try {
      const c = requireClient(client);
      const [earnings, total] = await Promise.all([
        c.getUserEarnings(date),
        c.getTotalUserEarnings(date),
      ]);

      return toolResult(JSON.stringify({ date, earnings, total }, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.tool(
  "get_profile_stats",
  "Calculate comprehensive trading statistics for a wallet address. Fetches all trades and computes volume, win rate, ROI, and earnings. Requires authentication.",
  {
    address: z.string().describe("Wallet address to analyze"),
  },
  async ({ address }) => {
    try {
      const c = requireClient(client);
      const stats = await c.getProfileStats(address);

      const totalVolume = stats.total_volume ?? 0;
      const totalEarnings = stats.total_earnings ?? 0;
      const winRate = stats.win_rate ?? 0;
      const roi = stats.roi ?? 0;

      const result = {
        ...stats,
        formatted: {
          totalTrades: stats.total_trades,
          totalVolume: `$${totalVolume.toFixed(2)}`,
          totalEarnings: `${totalEarnings >= 0 ? "+" : ""}$${totalEarnings.toFixed(2)}`,
          marketsTraded: stats.markets_traded,
          winRate: `${winRate.toFixed(1)}%`,
          roi: `${roi >= 0 ? "+" : ""}${roi.toFixed(2)}%`,
        },
      };

      return toolResult(JSON.stringify(result, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

// ============================================================================
// Trading Tools (auth required)
// ============================================================================

server.tool(
  "place_order",
  "Place a BUY or SELL order on a Polymarket market. WARNING: This executes a real trade with real funds. Requires authentication.",
  {
    market: z.string().describe("Market condition ID"),
    side: z.enum(["BUY", "SELL"]).describe("Order side: BUY or SELL"),
    outcome: z.string().describe("Outcome name (e.g., 'YES', 'NO')"),
    amount: z.number().positive().describe("Order size (number of shares)"),
    price: z.number().min(0.01).max(0.99).describe("Limit price (0.01 to 0.99)"),
    type: z.enum(["GTC", "FOK", "IOC"]).optional().default("GTC").describe(
      "Order type: GTC (Good Till Cancelled), FOK (Fill or Kill), IOC (Immediate or Cancel). Default: GTC"
    ),
  },
  async ({ market, side, outcome, amount, price, type }) => {
    try {
      const c = requireClient(client);
      const result = await c.placeOrder({
        market,
        side,
        outcome,
        amount,
        price,
        type,
      });

      return toolResult(JSON.stringify({
        success: true,
        order: result,
        summary: `${side} ${amount} shares of "${outcome}" at $${price.toFixed(2)} (${type}) -- Order ID: ${result.order_id}`,
      }, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.tool(
  "cancel_order",
  "Cancel an existing open order by its ID. Requires authentication.",
  {
    orderId: z.string().describe("Order ID to cancel"),
  },
  async ({ orderId }) => {
    try {
      const c = requireClient(client);
      await c.cancelOrder(orderId);
      return toolResult(JSON.stringify({
        success: true,
        orderId,
        message: `Order ${orderId} cancelled successfully.`,
      }, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

server.tool(
  "get_orders",
  "Get all open orders for the authenticated user. Requires authentication.",
  {},
  async () => {
    try {
      const c = requireClient(client);
      const orders = await c.getOrders();
      return toolResult(JSON.stringify(orders, null, 2));
    } catch (e) {
      return errorResult(e);
    }
  }
);

// ============================================================================
// Server Bootstrap
// ============================================================================

async function main() {
  // Initialize client from private key (if configured)
  await initializeClient();

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is reserved for MCP protocol)
  const mode = client ? "authenticated" : "read-only (Gamma API only)";
  process.stderr.write(`Polypure MCP Server v${VERSION} started (${mode})\n`);
}

main().catch((error) => {
  process.stderr.write(`Fatal: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
