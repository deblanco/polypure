# Polypure MCP Server

Model Context Protocol server that gives AI agents direct access to Polymarket prediction markets. Search markets, analyze orderbooks, track portfolios, and execute trades -- all through a standardized tool interface.

## Quick Start

### Install via npx (after publishing)

```bash
npx polypure-mcp
```

### Configure in Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "polypure": {
      "command": "npx",
      "args": ["polypure-mcp"],
      "env": {
        "POLYMARKET_PRIVATE_KEY": "0x...",
        "POLYMARKET_FUNDER_ADDRESS": "0x...",
        "POLYMARKET_SIGNATURE_TYPE": "1"
      }
    }
  }
}
```

### Configure in Claude Code

```bash
claude mcp add polypure -- npx polypure-mcp
```

Or for local development:

```bash
claude mcp add polypure -- node /path/to/polypure/dist/mcp.js
```

### Configure in Cursor

Add to Cursor settings under MCP Servers:

```json
{
  "polypure": {
    "command": "npx",
    "args": ["polypure-mcp"],
    "env": {
      "POLYMARKET_PRIVATE_KEY": "0x...",
      "POLYMARKET_FUNDER_ADDRESS": "0x...",
      "POLYMARKET_SIGNATURE_TYPE": "1"
    }
  }
}
```

## Authentication

The MCP server reads credentials from environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `POLYMARKET_PRIVATE_KEY` | For trading | Your wallet private key (hex) |
| `POLYMARKET_FUNDER_ADDRESS` | For trading | Your Polymarket profile address |
| `POLYMARKET_SIGNATURE_TYPE` | No | `0` = Browser Wallet, `1` = Magic/Email (default: `1`) |

**How to get your credentials:**
- **Private Key (Magic/Email login):** Export from https://reveal.magic.link/polymarket
- **Private Key (Browser wallet):** Export from MetaMask, Coinbase Wallet, etc.
- **Funder Address:** Your Polymarket profile address where you send USDC

**Without credentials**, the server starts in read-only mode. Market discovery tools (`search_series`, `get_series`) work without authentication via the Gamma API. All other tools return a clear error prompting you to set credentials.

API credentials (key, secret, passphrase) are automatically derived from your private key at startup and cached for 1 minute.

## Tools Reference

### Market Discovery (no auth required)

#### `search_series`

Search Polymarket prediction markets by text query. Returns series with their markets and current outcome prices.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | yes | Search text (e.g., "presidential election", "bitcoin price") |
| `limit` | number | no | Maximum results (default: 10) |
| `active` | boolean | no | Only active markets (default: true) |

#### `get_series`

Get a specific series/event by its URL slug.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | yes | URL slug (e.g., "presidential-election-winner-2024") |

### Markets

#### `get_market`

Get detailed market data by condition ID. Returns tokens, prices, fees, and metadata.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conditionId` | string | yes | Market condition ID (hex string) |

#### `get_markets`

List the first page of Polymarket markets. No parameters.

#### `search_markets`

Search markets by text query (filters on question, description, slug).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | yes | Search text |
| `limit` | number | no | Maximum results (default: 20) |

### Orderbooks

#### `get_orderbook`

Get the orderbook for a market outcome. Returns bid/ask levels with prices, sizes, and analysis (spread, depth, arbitrage detection).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `marketId` | string | yes | Market condition ID |
| `outcome` | string | yes | Outcome name (e.g., "YES", "NO") |

#### `get_orderbook_by_token`

Get the orderbook by token ID directly.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tokenId` | string | yes | Token asset ID |

### Account & Positions

#### `get_balance`

Get the authenticated user's USDC balance. Returns raw balance and human-readable formatted amount. No parameters.

#### `get_positions`

Get current open positions for the authenticated user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | no | Maximum positions (default: 100) |

#### `get_user_positions`

Get positions for a specific wallet address.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | yes | Wallet address |
| `limit` | number | no | Maximum positions (default: 100) |

#### `get_market_positions`

Get positions for a specific market.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conditionId` | string | yes | Market condition ID |
| `address` | string | no | Optional wallet address filter |

#### `get_portfolio`

Get portfolio summary with total value, cost basis, and unrealized PnL. Calculates current value from live orderbook prices.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | no | Wallet address (defaults to authenticated user) |

#### `get_profile`

Get user profile information for a wallet address.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | yes | Wallet address |

#### `get_trades`

Get trade history for the authenticated user.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `asset_id` | string | no | Filter by asset/token ID |
| `market` | string | no | Filter by market condition ID |

#### `get_earnings`

Get earnings for a specific date. Returns per-condition and total earnings breakdown.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | string | yes | Date in YYYY-MM-DD format |

#### `get_profile_stats`

Calculate comprehensive trading statistics for a wallet. Fetches all trades and computes volume, win rate, ROI, and earnings.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `address` | string | yes | Wallet address to analyze |

### Trading

#### `place_order`

Place a BUY or SELL order on a Polymarket market. Executes a real trade with real funds.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `market` | string | yes | Market condition ID |
| `side` | "BUY" \| "SELL" | yes | Order direction |
| `outcome` | string | yes | Outcome name (e.g., "YES", "NO") |
| `amount` | number | yes | Order size in shares (must be positive) |
| `price` | number | yes | Limit price (0.01 to 0.99) |
| `type` | "GTC" \| "FOK" \| "IOC" | no | Order type (default: GTC) |

Order types:
- **GTC** -- Good Till Cancelled. Stays on the book until filled or cancelled.
- **FOK** -- Fill or Kill. Must be fully filled immediately or is cancelled.
- **IOC** -- Immediate or Cancel. Fills what it can immediately, cancels the rest.

#### `cancel_order`

Cancel an existing open order by its ID.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `orderId` | string | yes | Order ID to cancel |

#### `get_orders`

Get all open orders for the authenticated user. No parameters.

## Example Conversations

Once configured, you can interact with Polymarket through natural language:

> "Search for prediction markets about the 2026 World Cup"

The AI calls `search_series` with query "2026 World Cup" and returns matching markets with current prices.

> "Show me the orderbook for the YES outcome on market 0xabc123..."

The AI calls `get_orderbook` and returns the full orderbook with best bid/ask, spread, and depth analysis.

> "What's my current portfolio value and P/L?"

The AI calls `get_portfolio` and returns your positions, total value, cost basis, and unrealized PnL.

> "Buy 50 shares of YES on market 0xabc123 at 0.65"

The AI calls `place_order` with the specified parameters and confirms the order placement.

## Development

### Build

```bash
bun install
bun run build
```

### Test with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/mcp.js
```

### Test locally with Claude Code

```bash
claude mcp add polypure-dev -- node dist/mcp.js
```

### Architecture

The MCP server (`src/mcp.ts`) is a thin adapter layer that:

1. Reads auth credentials from environment variables
2. Creates a `PolymarketClient` instance from the Polypure SDK
3. Registers each SDK method as an MCP tool with Zod input schemas
4. Connects via stdio transport for communication with MCP clients

All logging is directed to stderr to keep stdout clean for the MCP protocol. The server supports graceful degradation -- Gamma API tools work without authentication.

## Troubleshooting

### "Authentication required" errors

Set `POLYMARKET_PRIVATE_KEY` and `POLYMARKET_FUNDER_ADDRESS` in your MCP client configuration. Market discovery tools (`search_series`, `get_series`) work without credentials.

### Server not starting

Verify Node.js >= 18 is installed:

```bash
node --version
```

### Testing the server manually

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/mcp.js
```

You should see a JSON-RPC response with the server info.
