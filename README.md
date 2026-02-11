# Polypure

A thin TypeScript SDK for [Polymarket](https://polymarket.com) prediction markets. Ships with a full CLI, an MCP server for AI agents, and clean programmatic access to the CLOB API.

**Philosophy**: Pure functions and thin wrappers. You control the flow.

## Installation

```bash
bun add polypure
# or
npm install polypure
```

## Universal Compatibility (Browser & Node.js)

Polypure is a **universal SDK** that works identically in both Node.js and browser environments. No separate imports needed!

```typescript
// Same import works everywhere
import { createClientFromPrivateKey, getSeries, getProfile } from "polypure";

// Browser: Read-only market data
const series = await getSeries("highest-temperature-in-london-on-february-3-2026");

// Node.js: Full trading functionality
const client = await createClientFromPrivateKey({
  privateKey: process.env.POLYMARKET_PRIVATE_KEY!,
  funderAddress: process.env.POLYMARKET_FUNDER_ADDRESS!,
});
await client.placeOrder({ market: "0x...", side: "BUY", amount: 100, price: 0.65, outcome: "YES" });
```

### What Changed?

- **✅ Universal SDK**: Same code runs in browsers and Node.js
- **✅ No Node.js-only dependencies**: Removed Winston, @ethersproject/wallet, @polymarket/clob-client
- **✅ Modern web standards**: Uses Web Crypto API, native fetch, and viem
- **✅ 6x smaller bundle**: Down from 1.36MB to ~220KB
- **✅ Simplified imports**: Everything from `import { ... } from "polypure"`

### Browser Usage

All read-only functions work in browsers without authentication:

```typescript
import {
  getSeries,
  searchSeries,
  getProfile,
  getUserPositions,
  getUserTrades,
} from "polypure";

// Market discovery
const series = await getSeries("btc-updown-15m-1770929100");

// Profile queries (public data)
const profile = await getProfile("0xabc123...");
const positions = await getUserPositions("0xabc123...");
const trades = await getUserTrades({ address: "0xabc123...", limit: 20 });
```

### Authentication (Node.js or Secure Browser Environments)

Trading features require private key access:

```typescript
import { createClientFromPrivateKey } from "polypure";

const client = await createClientFromPrivateKey({
  privateKey: process.env.POLYMARKET_PRIVATE_KEY!,
  funderAddress: process.env.POLYMARKET_FUNDER_ADDRESS!,
  signatureType: 1, // 0 = Browser Wallet, 1 = Magic/Email (default)
});

// Now you can trade
await client.placeOrder({ ... });
await client.getBalance();
await client.getOrders();
```

**Note:** Private keys should never be exposed in client-side browser code. Use trading features only in:
- Node.js backends
- Secure browser environments (e.g., electron apps with secure storage)
- Serverless functions

### Available Everywhere

| Function | Browser | Node.js | Description |
|----------|---------|---------|-------------|
| `getSeries(slug)` | ✅ | ✅ | Get series/event by slug |
| `searchSeries(query, options)` | ✅ | ✅ | Search for series |
| `getProfile(address)` | ✅ | ✅ | Get public profile for any address |
| `getUserPositions(address)` | ✅ | ✅ | Get positions for any user |
| `getUserTrades(options)` | ✅ | ✅ | Get trades for any user |
| `createClientFromPrivateKey(config)` | ⚠️* | ✅ | Create authenticated client |
| `placeOrder(request)` | ⚠️* | ✅ | Place a trade |
| `getBalance()` | ⚠️* | ✅ | Get USDC balance |

*⚠️ Requires secure private key storage - not recommended for standard browser apps

## MCP Server (AI Agent Integration)

Polypure includes an [MCP (Model Context Protocol)](https://modelcontextprotocol.io) server that lets AI agents like Claude interact with Polymarket directly. 19 tools covering market discovery, orderbook analysis, portfolio tracking, and trading.

```bash
# Set credentials
export POLYMARKET_PRIVATE_KEY="0x..."
export POLYMARKET_FUNDER_ADDRESS="0x..."

# Run the MCP server
npx polypure-mcp
```

```bash
# Add to Claude Code
claude mcp add polypure -- npx polypure-mcp
```

See **[MCP.md](./MCP.md)** for full setup instructions, tool reference, and configuration for Claude Desktop, Claude Code, and Cursor.

## Logging

The SDK uses a lightweight logger for structured JSON logging. All logs are written to console in JSON format for easy parsing and analysis.

### Environment Variables

```bash
# Authentication (required for trading)
export POLYMARKET_PRIVATE_KEY="0x..."      # Your wallet private key
export POLYMARKET_FUNDER_ADDRESS="0x..."   # Your Polymarket profile address
export POLYMARKET_SIGNATURE_TYPE=1         # 0 = Browser Wallet, 1 = Magic/Email (default)

# Set log level (default: debug)
export LOG_LEVEL=debug  # Options: error, warn, info, debug
```

### Log Format

All logs are JSON formatted:

```json
{
  "level": "info",
  "message": "CLI command started",
  "command": "market",
  "args": ["0x123..."],
  "timestamp": "2026-02-09T21:00:00.000Z"
}
```

### Error Logging

Errors are always logged regardless of the `LOG_LEVEL` setting. When an error occurs, it includes:

```json
{
  "level": "error",
  "message": "Order rejected",
  "market": "0x123...",
  "side": "BUY",
  "error": "Insufficient balance",
  "timestamp": "2026-02-09T21:00:00.000Z"
}
```

### Programmatically Using the Logger

```typescript
import { log } from "polypure";

log.debug("Debug message", { someData: 123 });
log.info("Info message", { requestId: "abc-123" });
log.warn("Warning message", { retryAttempt: 3 });
log.error("Error occurred", new Error("Something went wrong"));
```

---

## Architecture Changes

### What's New in v1.5.0

**Universal SDK** - Works identically in browsers and Node.js:
- Removed Node.js-only dependencies (`winston`, `@ethersproject/wallet`, `@polymarket/clob-client`)
- Unified entry point - no more separate `polypure/browser` import
- Uses modern web standards: Web Crypto API, native fetch, viem
- Bundle size reduced from 1.36MB to ~220KB (6x smaller)

**Modern Authentication**:
- HMAC-SHA256 via Web Crypto API (works in browsers and Node.js 18+)
- EIP-712 signing via viem (universal, works everywhere)
- Direct fetch() with auth headers (no SDK wrapper dependency)

**Simplified API**:
- All imports from single entry point: `import { ... } from "polypure"`
- Same authentication flow in all environments
- Cleaner dependency tree

## Quick Start

```typescript
import { createClientFromPrivateKey } from "polypure";

// Create client from private key (API credentials derived automatically)
const client = await createClientFromPrivateKey({
  privateKey: process.env.POLYMARKET_PRIVATE_KEY!,
  funderAddress: process.env.POLYMARKET_FUNDER_ADDRESS!,
  signatureType: 1, // 0 = Browser Wallet, 1 = Magic/Email (default)
});

// Get a market
const market = await client.getMarket("0xabc123...");
console.log(market.question);  // "Will Bitcoin be above $50k?"

// Get orderbook for YES outcome
const book = await client.getOrderbook(market.market_id, "YES");
console.log(book.bids[0]);  // { price: 0.65, size: 1000 }
```

## Table of Contents

- [MCP Server (AI Agent Integration)](#mcp-server-ai-agent-integration)
- [CLI (Command Line)](#cli-command-line)
- [Authentication](#authentication)
- [Markets](#markets)
- [Orderbooks](#orderbooks)
- [Orders](#orders)
- [Trades & Balances](#trades--balances)
- [Positions](#positions)
- [Profiles & Portfolios](#profiles--portfolios)
- [Profile & Earnings](#profile--earnings)
- [Market Discovery](#market-discovery)
- [Order Utilities](#order-utilities)
- [Error Handling](#error-handling)
- [Types](#types)

---

## CLI (Command Line)

Polylib includes a full-featured CLI for trading and market discovery from the terminal.

### Installation

```bash
# Clone and build
git clone <repo>
cd polypure
bun install
bun run build

# Or use directly with bun
bun src/cli.ts --help
```

### Authentication

Provide credentials via CLI flags or environment variables:

```bash
# Using environment variables (recommended - more secure)
export POLYMARKET_PRIVATE_KEY="0x..."
export POLYMARKET_FUNDER_ADDRESS="0x..."
bun cli.ts balance

# Using CLI flags (less secure - visible in shell history)
bun cli.ts balance --private-key 0x... --funder 0x...

# Mixed approach
export POLYMARKET_PRIVATE_KEY="0x..."
bun cli.ts balance --funder 0x...
```

> **Security Warning:** Private keys passed via CLI flags are visible in your shell history and process lists. Using environment variables is recommended.

**How to get your credentials:**
- **Private Key (Magic/Email login):** Export from https://reveal.magic.link/polymarket
- **Private Key (Browser wallet):** Export from MetaMask, Coinbase Wallet, etc.
- **Funder Address:** Your Polymarket profile address where you send USDC

### Commands

#### Market Discovery (No Auth Required)

```bash
# Search for series by keyword
bun cli.ts find "bitcoin" -l 5

# Get specific series by slug
bun cli.ts series highest-temperature-in-london-on-february-3-2026

# JSON output for scripting
bun cli.ts series highest-temperature-in-london-on-february-3-2026 --json | jq '.markets[0].outcomes[0].tokenId'
```

#### Market Data (Auth Required)

```bash
# Get market details
bun cli.ts market 0xabc123...

# List all markets
bun cli.ts markets -l 20

# Search markets
bun cli.ts search "ethereum" -l 10

# Get orderbook
bun cli.ts orderbook 0xabc123... --outcome YES
bun cli.ts orderbook 0xabc123... --tokenId 0xdef456...
```

#### Trading

```bash
# Place buy order (GTC limit order by default)
bun cli.ts buy 0xabc123... \
  --amount 100 \
  --price 0.65 \
  --outcome YES

# Place sell order
bun cli.ts sell 0xabc123... \
  --amount 50 \
  --price 0.70 \
  --outcome NO \
  --type GTC

# Order types: GTC (default), FOK, IOC
bun cli.ts buy 0xabc123... -a 100 --price 0.65 -o YES --type FOK

# Cancel order
bun cli.ts cancel 0xorder789...

# List open orders
bun cli.ts orders
```

#### Account

```bash
# Check USDC balance
bun cli.ts balance

# Update USDC allowance
bun cli.ts allowance

# View trade history
bun cli.ts trades -l 20
```

#### Profile & Earnings (Auth Required)

```bash
# Get earnings for a specific date (default: today)
bun cli.ts earnings 2024-01-15

# Get total earnings for a date
bun cli.ts total-earnings 2024-01-15

# Get detailed rewards with market info
bun cli.ts rewards 2024-01-15

# Order rewards by volume
bun cli.ts rewards 2024-01-15 --order-by volume

# Filter by position (maker/taker)
bun cli.ts rewards 2024-01-15 --position maker

# Exclude competition rewards
bun cli.ts rewards 2024-01-15 --no-competition

# JSON output for analysis
bun cli.ts rewards 2024-01-15 --json | jq '[.[] | {question, earnings, volume}]'
```

#### Positions (Auth Required)

```bash
# Get your current positions
bun cli.ts positions

# Get positions for another wallet
bun cli.ts user-positions 0xabc123...

# Get positions in a specific market
bun cli.ts market-positions 0xabc123...

# Get positions for a specific user in a market
bun cli.ts market-positions 0xabc123... --address 0xdef456...

# Limit results
bun cli.ts positions -l 10
bun cli.ts user-positions 0xabc123... -l 20

# JSON output
bun cli.ts positions --json | jq '.summary[] | {question, total_size, avg_price}'
```

#### Portfolio & Profiles (Auth Required)

```bash
# Get your portfolio summary
bun cli.ts portfolio

# Get portfolio for another user
bun cli.ts portfolio --address 0xabc123...

# Get profile information for a user
bun cli.ts profile 0xabc123...

# Get calculated stats from trades
bun cli.ts profile-stats 0xabc123...

# Get trades for a user
bun cli.ts user-trades 0xabc123...

# Limit trades returned
bun cli.ts user-trades 0xabc123... -l 50

# JSON output for analysis
bun cli.ts portfolio --json | jq '{value: .total_value, pnl: .unrealized_pnl, markets: .markets_count}'
bun cli.ts profile-stats 0xabc123... --json | jq '{win_rate, roi, total_earnings}'
```

### CLI Options

| Option | Short | Description |
|--------|-------|-------------|
| `--private-key` | `-k` | Wallet private key (or `POLYMARKET_PRIVATE_KEY` env) |
| `--funder` | `-f` | Polymarket profile address (or `POLYMARKET_FUNDER_ADDRESS` env) |
| `--signature-type` | | 0 = Browser Wallet, 1 = Magic/Email (default: 1) |
| `--outcome` | `-o` | Outcome name (YES, NO, etc.) |
| `--tokenId` | `-t` | Token ID (alternative to outcome) |
| `--amount` | `-a` | Order amount in shares |
| `--price` | | Order price (0-1) |
| `--type` | | Order type: GTC, FOK, IOC |
| `--limit` | `-l` | Limit results |
| `--order-by` | | Order rewards by field (volume, earnings, etc.) |
| `--position` | | Filter rewards by position (maker, taker) |
| `--no-competition` | | Exclude competition rewards |
| `--address` | | Wallet address for profile queries |
| `--json` | `-j` | Output JSON |
| `--raw` | `-r` | Output raw JSON |
| `--help` | `-h` | Show help |

### CLI Examples

**Weather Trading Workflow:**

```bash
# 1. Find the temperature series
bun cli.ts series highest-temperature-in-london-on-february-3-2026

# 2. Extract the market ID for 5°C question
MARKET_ID=$(bun cli.ts series highest-temperature-in-london-on-february-3-2026 --json | \
  jq -r '.markets[] | select(.question | contains("5°C")) | .conditionId')

# 3. Check orderbook
bun cli.ts orderbook $MARKET_ID --outcome YES

# 4. Place limit buy at 0.65
bun cli.ts buy $MARKET_ID -a 100 --price 0.65 -o YES --type GTC

# 5. Check open orders
bun cli.ts orders

# 6. Cancel if needed
bun cli.ts cancel 0xorder...
```

**JSON Output for Scripting:**

```bash
# Get all market data as JSON
bun cli.ts markets --json | jq '.[0] | {id: .market_id, question: .question}'

# Get orderbook as JSON
bun cli.ts orderbook 0xabc... -o YES --json | jq '{bestBid: .bids[0], bestAsk: .asks[0]}'

# Extract token IDs for automated trading
bun cli.ts series my-series-slug --json | \
  jq -r '.markets[].outcomes[] | "\(.name): \(.tokenId)"'
```

**Profile Analysis Workflow:**

```bash
# 1. Look up a user's portfolio
bun cli.ts portfolio --address 0xabc123...

# 2. Check their current positions
bun cli.ts user-positions 0xabc123...

# 3. Get their trading stats
bun cli.ts profile-stats 0xabc123...

# 4. Analyze their recent trades
bun cli.ts user-trades 0xabc123... -l 50

# 5. Export to JSON for custom analysis
bun cli.ts portfolio --address 0xabc123... --json | \
  jq '{value: .total_value, pnl: .unrealized_pnl, roi: (.unrealized_pnl / .total_cost * 100)}'
```

---

## Authentication

Create a client using your private key. API credentials are derived automatically:

```typescript
import { createClientFromPrivateKey } from "polypure";

const client = await createClientFromPrivateKey({
  privateKey: process.env.POLYMARKET_PRIVATE_KEY!,
  funderAddress: process.env.POLYMARKET_FUNDER_ADDRESS!,
  signatureType: 1, // 0 = Browser Wallet, 1 = Magic/Email (default)
});
```

### Getting Your Credentials

| Credential | How to Obtain |
|------------|---------------|
| **Private Key (Magic/Email)** | Export from https://reveal.magic.link/polymarket |
| **Private Key (Browser Wallet)** | Export from MetaMask, Coinbase Wallet, etc. |
| **Funder Address** | Your Polymarket profile address where you send USDC |

### Configuration Options

```typescript
interface PrivateKeyConfig {
  /** Wallet private key (hex string, with or without 0x prefix). */
  privateKey: string;
  
  /** Polymarket profile address (where you send USDC to fund your account). */
  funderAddress: string;
  
  /**
   * Signature type for order signing.
   * - 0 = Browser Wallet (MetaMask, Coinbase Wallet, etc.)
   * - 1 = Magic/Email Login (default)
   */
  signatureType?: 0 | 1;
}
```

### Credential Caching

API credentials derived from your private key are cached for 1 minute to avoid repeated derivation calls. The cache supports up to 10 different wallets.

---

## Markets

### Get Market by Condition ID

```typescript
const market = await client.getMarket("0xabc123...");

console.log(market.question);       // Market question
console.log(market.description);    // Full description
console.log(market.active);         // Is trading active?
console.log(market.closed);         // Is market resolved?
console.log(market.end_date_iso);   // Resolution date
console.log(market.tokens);         // [{ token_id, outcome, price }]
```

### List All Markets

```typescript
const markets = await client.getMarkets();
// Returns first page of markets
```

### Search Markets

```typescript
const results = await client.searchMarkets("bitcoin", 10);
// Client-side search, returns up to 10 matches
```

### Market Interface

```typescript
interface Market {
  market_id: string;
  question: string;
  description: string;
  active: boolean;
  closed: boolean;
  market_slug: string;
  tags: string[];
  end_date_iso: string;
  tokens: Token[];
  // ... more fields
}

interface Token {
  token_id: string;
  outcome: string;  // "YES", "NO", "Over 12.5°C", etc.
  price: number;
  winner: boolean;
}
```

---

## Orderbooks

### Get Orderbook by Outcome

```typescript
const book = await client.getOrderbook(marketId, "YES");

console.log(book.bids);  // [{ price: 0.65, size: 1000 }, ...]
console.log(book.asks);  // [{ price: 0.66, size: 500 }, ...]
console.log(book.hash);  // Orderbook hash for change detection
```

### Get Orderbook by Token ID

```typescript
const book = await client.getOrderbookByTokenId("0xdef456...");
```

### Orderbook Interface

```typescript
interface Orderbook {
  market: string;
  asset_id: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  hash: string;
}

interface OrderbookLevel {
  price: number;
  size: number;
}
```

---

## Orders

### Place an Order

```typescript
import { normalizeOrder } from "polypure";

// Normalize price to valid tick (0.01 default, 0.001 near extremes)
const { amount, price } = normalizeOrder(100, 0.65321);

const order = await client.placeOrder({
  market: "0xabc123...",
  side: "BUY",
  outcome: "YES",        // Or "NO", "Over 12.5°C", etc.
  amount: 100,           // Number of shares
  price: 0.65,           // Price per share (0-1)
  type: "GTC",           // "GTC" | "FOK" | "IOC"
});

console.log(order.order_id);
console.log(order.status);           // "PENDING" | "OPEN" | "FILLED" | ...
console.log(order.filled_size);      // Shares filled
console.log(order.remaining_size);   // Shares remaining
```

### Using Token ID Directly

```typescript
const order = await client.placeOrder({
  market: "0xabc123...",
  side: "SELL",
  tokenId: "0xdef456...",  // Direct token ID
  amount: 50,
  price: 0.70,
  type: "GTC",
});
```

### Cancel Orders

```typescript
// Cancel single order
await client.cancelOrder("0xorder789...");

// Get open orders
const orders = await client.getOrders();

// Get order details
const order = await client.getOrder("0xorder789...");
```

### OrderRequest Interface

```typescript
interface OrderRequest {
  market: string;        // Condition ID
  side: "BUY" | "SELL";
  outcome?: string;      // "YES", "NO", etc.
  tokenId?: string;      // Direct token ID
  amount: number;        // Shares
  price: number;         // 0-1
  type?: "GTC" | "FOK" | "IOC";
}

// GTC = Good Till Cancelled
// FOK = Fill Or Kill
// IOC = Immediate Or Cancel
```

---

## Trades & Balances

### Get Trades

```typescript
// All trades
const trades = await client.getTrades();

// Filter by asset
const trades = await client.getTrades({ 
  asset_id: "0xtoken123..." 
});

// Filter by market
const trades = await client.getTrades({ 
  market: "0xmarket456..." 
});
```

### Get Balance

```typescript
// Raw balance (in 6 decimals)
const { balance } = await client.getBalance();
console.log(balance);  // "1000000000" = 1000 USDC

// As number
const usdc = await client.getUSDCBalance();
console.log(usdc);  // 1000.00
```

### Update Allowance

```typescript
// Approve CLOB contract to spend USDC
await client.updateAllowance();
```

### Trade Interface

```typescript
interface Trade {
  id: string;
  market: string;
  asset_id: string;
  side: "BUY" | "SELL";
  size: string;
  price: string;
  outcome: string;
  transaction_hash: string;
  trader_side: "TAKER" | "MAKER";
  match_time: string;
}
```

---

## Positions

Query current trading positions for yourself or other users.

### Get Your Current Positions

```typescript
// Get all current positions
const positions = await client.getCurrentPositions();

console.log(`Total positions: ${positions.positions.length}`);
console.log(`Markets with positions: ${positions.summary.length}`);

for (const summary of positions.summary) {
  console.log(`${summary.question}: ${summary.side} ${summary.total_size} @ ${summary.avg_price}`);
}
```

### Get Positions for Another User

```typescript
// Get positions for a specific wallet address
const userPositions = await client.getUserPositions("0xabc123...");

console.log(`Positions for user: ${userPositions.positions.length}`);
```

### Get Positions for a Specific Market

```typescript
// Get your positions in a specific market
const marketPositions = await client.getMarketPositions("0xabc123...");

// Get another user's positions in a market
const userMarketPositions = await client.getMarketPositions(
  "0xabc123...",
  "0xdef456..." // optional address
);
```

### Get All Positions (Paginated)

```typescript
// Fetch all positions automatically (handles pagination)
const allPositions = await client.getAllPositions();
const allUserPositions = await client.getAllPositions("0xabc123...");
```

### Position Interfaces

```typescript
interface Position {
  order_id?: string;
  asset_id: string;
  side: "BUY" | "SELL";
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

interface PositionSummary {
  condition_id: string;
  question: string;
  market_slug: string;
  positions: Position[];
  total_size: number;
  avg_price: number;
  side: "BUY" | "SELL";
}

interface PositionsResponse {
  positions: Position[];
  summary: PositionSummary[];
  next_cursor?: string;
}
```

---

## Profiles & Portfolios

Query profiles, portfolios, and statistics for any wallet address.

### Get User Profile

```typescript
// Get profile information for any wallet address
const profile = await client.getProfile("0xabc123...");

console.log(`Username: ${profile.username}`);
console.log(`Avatar: ${profile.avatar}`);
console.log(`Created: ${profile.created_at}`);

if (profile.stats) {
  console.log(`Trades: ${profile.stats.total_trades}`);
  console.log(`Volume: $${profile.stats.total_volume}`);
  console.log(`Earnings: $${profile.stats.total_earnings}`);
}
```

### Get Portfolio Summary

```typescript
// Get your portfolio
const myPortfolio = await client.getPortfolio();

// Get another user's portfolio
const userPortfolio = await client.getPortfolio("0xabc123...");

console.log(`Total Value: $${myPortfolio.total_value}`);
console.log(`Total Cost: $${myPortfolio.total_cost}`);
console.log(`Unrealized P/L: $${myPortfolio.unrealized_pnl}`);
console.log(`Markets: ${myPortfolio.markets_count}`);
```

### Get Trades for a User

```typescript
// Get trades for a user
const tradesResponse = await client.getUserTrades({
  address: "0xabc123...",
  limit: 20,
  next_cursor: undefined,
});

console.log(`Trades: ${tradesResponse.trades.length}`);
console.log(`Next cursor: ${tradesResponse.next_cursor}`);
```

### Get All Trades for a User

```typescript
// Automatically fetch all pages of trades
const allTrades = await client.getAllUserTrades("0xabc123...");
console.log(`Total trades: ${allTrades.length}`);
```

### Get Profile Statistics

```typescript
// Calculate stats from historical trade data
const stats = await client.getProfileStats("0xabc123...");

console.log(`Total Trades: ${stats.total_trades}`);
console.log(`Total Volume: $${stats.total_volume}`);
console.log(`Total Earnings: $${stats.total_earnings}`);
console.log(`Markets Traded: ${stats.markets_traded}`);
console.log(`Win Rate: ${stats.win_rate}%`);
console.log(`ROI: ${stats.roi}%`);
```

### Profile & Portfolio Interfaces

```typescript
interface UserProfile {
  address: string;
  username?: string;
  avatar?: string;
  created_at?: string;
  stats?: ProfileStats;
}

interface ProfileStats {
  total_trades?: number;
  total_volume?: number;
  total_earnings?: number;
  markets_traded?: number;
  win_rate?: number;
  roi?: number;
}

interface UserPortfolio {
  address: string;
  positions: Position[];
  total_value: number;
  total_cost: number;
  unrealized_pnl: number;
  markets_count: number;
}

interface UserTradesOptions {
  address?: string;
  asset_id?: string;
  market?: string;
  next_cursor?: string;
  limit?: number;
}

interface UserTradesResponse {
  trades: Trade[];
  next_cursor?: string;
  count?: number;
}
```

---

## Profile & Earnings

Query your profile data, earnings, and rewards on Polymarket.

### Get User Earnings for a Date

```typescript
// Get earnings for a specific date
const earnings = await client.getUserEarnings("2024-01-15");

for (const earning of earnings) {
  console.log(`Market: ${earning.condition_id}`);
  console.log(`Earnings: ${earning.earnings}`);
  console.log(`Asset: ${earning.asset_address}`);
}
```

### Get Total User Earnings

```typescript
// Get total earnings for a specific date
const totalEarnings = await client.getTotalUserEarnings("2024-01-15");

for (const total of totalEarnings) {
  console.log(`Total Earnings: ${total.earnings}`);
  console.log(`Asset Rate: ${total.asset_rate}`);
}
```

### Get User Rewards with Market Details

```typescript
// Get detailed earnings with market info
const rewards = await client.getUserRewardsEarnings("2024-01-15", {
  order_by: "volume",
  position: "maker",
  no_competition: false,
});

for (const reward of rewards) {
  console.log(`Market: ${reward.question}`);
  console.log(`Slug: ${reward.market_slug}`);
  console.log(`Earnings: ${reward.earnings}`);
  console.log(`Trades: ${reward.trades}`);
  console.log(`Volume: ${reward.volume}`);
  console.log(`LP Rewards: ${reward.lp_rewards_earned}`);
}
```

### Profile & Earnings Interfaces

```typescript
interface UserEarning {
  date: string;
  condition_id: string;
  asset_address: string;
  maker_address: string;
  earnings: number;
}

interface TotalUserEarning {
  date: string;
  asset_address: string;
  maker_address: string;
  earnings: number;
  asset_rate: number;
}

interface UserRewardsEarning {
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
```

---

## Market Discovery

Fetch markets from Gamma API (read-only, no auth required).

### Get Series by Slug

```typescript
import { getSeries } from "polypure";

const series = await getSeries("highest-temperature-in-london-on-february-3-2026");

console.log(series?.title);      // "Highest temperature in London on February 3, 2026"
console.log(series?.markets.length);  // Number of markets in series

for (const market of series?.markets || []) {
  console.log(market.question);  // "Will the highest temperature be over 12.5°C?"
  
  for (const outcome of market.outcomes) {
    console.log(`  ${outcome.name}: ${outcome.tokenId}`);
    // "Over 12.5°C: 0xabc..."
    // "Over 13.5°C: 0xdef..."
  }
}
```

### Search Series

```typescript
import { searchSeries } from "polypure";

const results = await searchSeries("bitcoin", { limit: 5 });

for (const series of results) {
  console.log(`${series.slug}: ${series.markets.length} markets`);
}
```

### Series Interface

```typescript
interface Series {
  id: string;
  title: string;
  slug: string;
  description?: string;
  endDate: string;
  closed: boolean;
  markets: MarketInfo[];
}

interface MarketInfo {
  conditionId: string;
  question: string;
  slug: string;
  endDate: string;
  outcomes: OutcomeInfo[];  // ALL outcomes with token IDs
  active: boolean;
  closed: boolean;
  tags: string[];
}

interface OutcomeInfo {
  tokenId: string;
  name: string;      // "YES", "Over 12.5°C", etc.
  price?: number;
}
```

### Parse Token IDs

If you have raw API data:

```typescript
import { parseTokenIds, parseOutcomes } from "polypure";

const tokenIds = parseTokenIds('["0xabc...", "0xdef..."]');
// ["0xabc...", "0xdef..."]

const outcomes = parseOutcomes('["YES", "NO"]');
// ["YES", "NO"]
```

---

## Order Utilities

### Price Alignment

```typescript
import { getTickSize, alignPrice, normalizeOrder } from "polypure";

// Get tick size for price
getTickSize(0.5);   // 0.01 (default)
getTickSize(0.97);  // 0.001 (near extremes >0.96 or <0.04)

// Align price to valid tick
alignPrice(0.65321);  // 0.65
alignPrice(0.978);    // 0.978 (3 decimals)

// Full validation
const { amount, price } = normalizeOrder(100, 0.65321, 5);
// Throws if amount < minSize
// Returns aligned price
```

### Orderbook Analysis

```typescript
import { 
  getBestPrices, 
  calculateDepth, 
  calculateSpread,
  isArbitrage 
} from "polypure";

const book = await client.getOrderbook(marketId, "YES");

// Best prices
const { bestBid, bestAsk, spread } = getBestPrices(book);
// { bestBid: 0.65, bestAsk: 0.66, spread: 0.01 }

// Depth
const { bidDepth, askDepth } = calculateDepth(book);
// { bidDepth: 5000, askDepth: 3000 }

// Spread only
const spread = calculateSpread(book);

// Arbitrage check (YES + NO < 1.0)
const hasArb = isArbitrage(book, 0.98);  // threshold optional
```

---

## Error Handling

```typescript
import { 
  PolymarketError, 
  AuthenticationError, 
  ValidationError 
} from "polypure";

try {
  await client.placeOrder(order);
} catch (err) {
  if (err instanceof ValidationError) {
    // Invalid order params (price out of range, etc.)
    console.error("Validation:", err.message);
  } else if (err instanceof AuthenticationError) {
    // API key issues
    console.error("Auth:", err.message);
  } else if (err instanceof PolymarketError) {
    // Generic API error
    console.error("API Error:", err.code, err.status, err.message);
  } else {
    // Network or other error
    console.error("Error:", err);
  }
}
```

### Error Types

| Error | Code | Status | When |
|-------|------|--------|------|
| `PolymarketError` | `HTTP_ERROR` | varies | Generic HTTP error |
| `PolymarketError` | `ORDER_REJECTED` | - | Order rejected by API |
| `AuthenticationError` | `AUTH_ERROR` | 401 | Invalid credentials |
| `ValidationError` | `VALIDATION_ERROR` | 400 | Invalid parameters |

---

## Types

All types are exported:

```typescript
import type {
  // Core
  Market,
  Token,
  Orderbook,
  OrderbookLevel,
  Order,
  OrderRequest,
  OrderResponse,
  OrderSide,
  OrderType,
  OrderStatus,
  Trade,
  BalanceAllowance,

  // Positions
  Position,
  PositionSummary,
  PositionsResponse,

  // Profiles & Portfolios
  UserProfile,
  ProfileStats,
  UserPortfolio,
  UserTradesOptions,
  UserTradesResponse,

  // Profile & Earnings
  UserEarning,
  TotalUserEarning,
  UserRewardsEarning,

  // Discovery
  Series,
  MarketInfo,
  OutcomeInfo,
  GammaEvent,
  GammaMarket,

  // Client
  ClientOptions,
  PrivateKeyConfig,
} from "polypure";
```

---

## Constants

```typescript
import { 
  POLYMARKET_CLOB_HOST, 
  POLYMARKET_WS_URL,
  GAMMA_API_BASE,
  VERSION 
} from "polypure";

console.log(VERSION);  // "1.5.0"
```

---

## Advanced Example: Trading Bot Skeleton

```typescript
import { 
  createClientFromPrivateKey, 
  getSeries, 
  getBestPrices, 
  isArbitrage,
  normalizeOrder 
} from "polypure";

const client = await createClientFromPrivateKey({
  privateKey: process.env.POLYMARKET_PRIVATE_KEY!,
  funderAddress: process.env.POLYMARKET_FUNDER_ADDRESS!,
});

async function checkArbitrage() {
  const series = await getSeries("btc-up-or-down-15m-...");
  if (!series) return;
  
  const market = series.markets[0];
  
  // Get both sides
  const yesBook = await client.getOrderbook(market.conditionId, "YES");
  const noBook = await client.getOrderbook(market.conditionId, "NO");
  
  const yesPrices = getBestPrices(yesBook);
  const noPrices = getBestPrices(noBook);
  
  if (yesPrices.bestAsk && noPrices.bestAsk) {
    const combined = yesPrices.bestAsk + noPrices.bestAsk;
    
    if (combined < 1.0) {
      // Arbitrage opportunity!
      const profit = 1.0 - combined;
      console.log(`Arbitrage: ${profit * 100}% profit`);
      
      // Place orders...
    }
  }
}

// Your polling logic
setInterval(checkArbitrage, 5000);
```

---

## License

MIT
