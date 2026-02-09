# Polypure

A thin, zero-side-effects TypeScript SDK for [Polymarket](https://polymarket.com) prediction markets.

**Philosophy**: No logging, no polling, no services. Pure functions and thin wrappers. You control the flow.

## Installation

```bash
bun add polypure
# or
npm install polypure
```

## Quick Start

```typescript
import { PolymarketClient } from "polypure";

const client = new PolymarketClient({
  apiKey: process.env.POLY_API_KEY!,
  apiSecret: process.env.POLY_API_SECRET!,
  apiPassphrase: process.env.POLY_API_PASSPHRASE!,
});

// Get a market
const market = await client.getMarket("0xabc123...");
console.log(market.question);  // "Will Bitcoin be above $50k?"

// Get orderbook for YES outcome
const book = await client.getOrderbook(market.market_id, "YES");
console.log(book.bids[0]);  // { price: 0.65, size: 1000 }
```

## Table of Contents

- [CLI (Command Line)](#cli-command-line)
- [Authentication](#authentication)
- [Markets](#markets)
- [Orderbooks](#orderbooks)
- [Orders](#orders)
- [Trades & Balances](#trades--balances)
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
cd polylib
bun install
bun run build

# Or use directly with bun
bun src/cli.ts --help
```

### Authentication

Provide credentials via flags or environment variables:

```bash
# Flags
bun cli.ts market 0xabc... --key API_KEY --secret SECRET --pass PASSPHRASE

# Environment variables (recommended)
export POLY_API_KEY="your-api-key"
export POLY_API_SECRET="your-api-secret"
export POLY_API_PASSPHRASE="your-passphrase"
bun cli.ts market 0xabc...
```

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
  --outcome YES \
  --key KEY --secret SECRET --pass PASS

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

### CLI Options

| Option | Short | Description |
|--------|-------|-------------|
| `--key` | `-k` | API key |
| `--secret` | `-s` | API secret |
| `--pass` | `-p` | API passphrase |
| `--outcome` | `-o` | Outcome name (YES, NO, etc.) |
| `--tokenId` | `-t` | Token ID (alternative to outcome) |
| `--amount` | `-a` | Order amount in shares |
| `--price` | | Order price (0-1) |
| `--type` | | Order type: GTC, FOK, IOC |
| `--limit` | `-l` | Limit results |
| `--order-by` | | Order rewards by field (volume, earnings, etc.) |
| `--position` | | Filter rewards by position (maker, taker) |
| `--no-competition` | | Exclude competition rewards |
| `--proxy` | | Gnosis Safe proxy address |
| `--rpc` | | Polygon RPC URL |
| `--funder` | | Funder address |
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

---

## Authentication

Create a client with your Polymarket API credentials:

```typescript
const client = new PolymarketClient({
  apiKey: "your-api-key",
  apiSecret: "your-api-secret",
  apiPassphrase: "your-passphrase",
});
```

### With Signer (for deriving API keys)

```typescript
import { Wallet } from "ethers";

const wallet = new Wallet(privateKey);

const client = new PolymarketClient({
  apiKey: "...",
  apiSecret: "...",
  apiPassphrase: "...",
  signer: wallet,
});

// Derive new API key from signer
const newAuth = await client.deriveApiKey();
```

### Options

```typescript
interface ClientOptions {
  apiKey: string;
  apiSecret: string;
  apiPassphrase: string;
  proxyAddress?: string;     // Gnosis Safe proxy
  signer?: any;              // ethers/viem signer
  rpcUrl?: string;           // Polygon RPC
  signatureType?: number;    // Signature type
  funderAddress?: string;    // Gnosis Safe funder
  baseUrl?: string;          // Custom CLOB URL
}
```

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
  AuthConfig,
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

console.log(VERSION);  // "0.2.0"
```

---

## Advanced Example: Trading Bot Skeleton

```typescript
import { 
  PolymarketClient, 
  getSeries, 
  getBestPrices, 
  isArbitrage,
  normalizeOrder 
} from "polypure";

const client = new PolymarketClient({
  apiKey: process.env.POLY_API_KEY!,
  apiSecret: process.env.POLY_API_SECRET!,
  apiPassphrase: process.env.POLY_API_PASSPHRASE!,
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
