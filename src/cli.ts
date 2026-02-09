#!/usr/bin/env bun
/**
 * Polylib CLI - Command-line interface for Polymarket trading
 * 
 * Usage:
 *   bun cli.ts market <conditionId> --key <apiKey> --secret <secret> --pass <passphrase>
 *   bun cli.ts orderbook <marketId> --outcome YES --key ... --secret ... --pass ...
 *   bun cli.ts buy <marketId> --outcome YES --amount 100 --price 0.65 --key ...
 *   bun cli.ts balance --key ... --secret ... --pass ...
 * 
 * Environment variables:
 *   POLY_API_KEY, POLY_API_SECRET, POLY_API_PASSPHRASE, POLY_PRIVATE_KEY
 */

import { 
  PolymarketClient, 
  getSeries, 
  searchSeries,
  getBestPrices,
  calculateSpread,
  calculateDepth,
  isArbitrage,
  normalizeOrder,
  type OrderRequest,
  type OrderSide,
  type OrderType,
} from "./index.js";

// ============================================================================
// CLI Types
// ============================================================================

type Command = 
  | "market" | "markets" | "search"
  | "orderbook" | "book"
  | "buy" | "sell" | "cancel" | "orders"
  | "balance" | "allowance"
  | "trades"
  | "series" | "find"
  | "derive"
  | "help";

interface CliOptions {
  key?: string;
  secret?: string;
  pass?: string;
  passphrase?: string;
  outcome?: string;
  tokenId?: string;
  amount?: number;
  price?: number;
  type?: OrderType;
  limit?: number;
  proxy?: string;
  rpc?: string;
  funder?: string;
  json?: boolean;
  raw?: boolean;
}

// ============================================================================
// Argument Parser
// ============================================================================

function parseArgs(args: string[]): { command: Command; args: string[]; options: CliOptions } {
  const options: CliOptions = {};
  const positional: string[] = [];
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    
    switch (arg) {
      case "--key":
      case "-k":
        options.key = next;
        i++;
        break;
      case "--secret":
      case "-s":
        options.secret = next;
        i++;
        break;
      case "--pass":
      case "--passphrase":
      case "-p":
        options.pass = next;
        options.passphrase = next;
        i++;
        break;
      case "--outcome":
      case "-o":
        options.outcome = next;
        i++;
        break;
      case "--tokenId":
      case "--token":
      case "-t":
        options.tokenId = next;
        i++;
        break;
      case "--amount":
      case "-a":
        options.amount = parseFloat(next);
        i++;
        break;
      case "--price":
        options.price = parseFloat(next);
        i++;
        break;
      case "--type":
        options.type = next as OrderType;
        i++;
        break;
      case "--limit":
      case "-l":
        options.limit = parseInt(next);
        i++;
        break;
      case "--proxy":
        options.proxy = next;
        i++;
        break;
      case "--rpc":
        options.rpc = next;
        i++;
        break;
      case "--funder":
        options.funder = next;
        i++;
        break;
      case "--json":
      case "-j":
        options.json = true;
        break;
      case "--raw":
      case "-r":
        options.raw = true;
        break;
      case "--help":
      case "-h":
        positional.push("help");
        break;
      default:
        if (!arg.startsWith("-")) {
          positional.push(arg);
        }
    }
  }
  
  const command = (positional[0] || "help") as Command;
  return { command, args: positional.slice(1), options };
}

// ============================================================================
// Client Factory
// ============================================================================

function createClient(options: CliOptions): PolymarketClient {
  const apiKey = options.key || process.env.POLY_API_KEY;
  const apiSecret = options.secret || process.env.POLY_API_SECRET;
  const apiPassphrase = options.pass || options.passphrase || process.env.POLY_API_PASSPHRASE;
  
  if (!apiKey || !apiSecret || !apiPassphrase) {
    throw new Error(
      "Missing API credentials. Provide --key, --secret, --pass or set " +
      "POLY_API_KEY, POLY_API_SECRET, POLY_API_PASSPHRASE env vars"
    );
  }
  
  return new PolymarketClient({
    apiKey,
    apiSecret,
    apiPassphrase,
    proxyAddress: options.proxy,
    rpcUrl: options.rpc,
    funderAddress: options.funder,
  });
}

// ============================================================================
// Output Formatters
// ============================================================================

function output(data: unknown, options: CliOptions): void {
  if (options.json || options.raw) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(data);
  }
}

function formatMarket(market: any): string {
  const lines = [
    `📊 ${market.question}`,
    `   ID: ${market.market_id || market.conditionId}`,
    `   Status: ${market.active ? "🟢 Active" : "🔴 Inactive"} ${market.closed ? "| Closed" : ""}`,
    `   End: ${market.end_date_iso || market.endDate}`,
  ];
  
  if (market.tokens?.length) {
    lines.push("   Outcomes:");
    for (const token of market.tokens) {
      lines.push(`     • ${token.outcome}: $${token.price?.toFixed(3) || "?"}`);
    }
  }
  
  if (market.outcomes?.length) {
    lines.push("   Outcomes:");
    for (const out of market.outcomes) {
      lines.push(`     • ${out.name}: ${out.tokenId?.slice(0, 20)}...`);
    }
  }
  
  return lines.join("\n");
}

function formatOrderbook(book: any): string {
  const lines = [
    `📖 Orderbook: ${book.market || book.asset_id}`,
    ``,
    `   BIDS (Buy):`,
  ];
  
  if (book.bids?.length) {
    for (const bid of book.bids.slice(0, 5)) {
      lines.push(`     ${bid.price.toFixed(3)} × ${bid.size}`);
    }
  } else {
    lines.push("     (no bids)");
  }
  
  lines.push("", `   ASKS (Sell):`);
  
  if (book.asks?.length) {
    for (const ask of book.asks.slice(0, 5)) {
      lines.push(`     ${ask.price.toFixed(3)} × ${ask.size}`);
    }
  } else {
    lines.push("     (no asks)");
  }
  
  const { bestBid, bestAsk, spread } = getBestPrices(book);
  lines.push(
    "",
    `   Best Bid: ${bestBid?.toFixed(3) || "-"}`,
    `   Best Ask: ${bestAsk?.toFixed(3) || "-"}`,
    `   Spread: ${spread === Infinity ? "-" : spread.toFixed(3)}`
  );
  
  return lines.join("\n");
}

function formatOrder(order: any): string {
  return [
    `📝 Order: ${order.order_id || order.id}`,
    `   Status: ${order.status}`,
    `   Side: ${order.side}`,
    `   Size: ${order.filled_size || order.size}/${order.remaining_size ? order.size : "-"}`,
    `   Price: ${order.price}`,
  ].join("\n");
}

// ============================================================================
// Commands
// ============================================================================

async function cmdMarket(args: string[], options: CliOptions): Promise<void> {
  const client = createClient(options);
  const conditionId = args[0];
  
  if (!conditionId) {
    console.error("Usage: cli.ts market <conditionId>");
    process.exit(1);
  }
  
  const market = await client.getMarket(conditionId);
  
  if (options.json) {
    output(market, options);
  } else {
    console.log(formatMarket(market));
  }
}

async function cmdMarkets(args: string[], options: CliOptions): Promise<void> {
  const client = createClient(options);
  const markets = await client.getMarkets();
  const limit = options.limit || 20;
  
  if (options.json) {
    output(markets.slice(0, limit), options);
  } else {
    console.log(`Found ${markets.length} markets (showing first ${limit}):\n`);
    for (const market of markets.slice(0, limit)) {
      console.log(formatMarket(market));
      console.log();
    }
  }
}

async function cmdSearch(args: string[], options: CliOptions): Promise<void> {
  const client = createClient(options);
  const query = args.join(" ");
  
  if (!query) {
    console.error("Usage: cli.ts search <query>");
    process.exit(1);
  }
  
  const markets = await client.searchMarkets(query, options.limit || 10);
  
  if (options.json) {
    output(markets, options);
  } else {
    console.log(`Found ${markets.length} matches for "${query}":\n`);
    for (const market of markets) {
      console.log(formatMarket(market));
      console.log();
    }
  }
}

async function cmdOrderbook(args: string[], options: CliOptions): Promise<void> {
  const client = createClient(options);
  const marketId = args[0];
  
  if (!marketId) {
    console.error("Usage: cli.ts orderbook <marketId> [--outcome YES]");
    process.exit(1);
  }
  
  let book;
  if (options.tokenId) {
    book = await client.getOrderbookByTokenId(options.tokenId);
  } else {
    book = await client.getOrderbook(marketId, options.outcome || "YES");
  }
  
  if (options.json) {
    output(book, options);
  } else {
    console.log(formatOrderbook(book));
  }
}

async function cmdPlaceOrder(side: OrderSide, args: string[], options: CliOptions): Promise<void> {
  const client = createClient(options);
  const marketId = args[0];
  
  if (!marketId || !options.amount || !options.price) {
    console.error(`Usage: cli.ts ${side.toLowerCase()} <marketId> --amount <shares> --price <0-1> [--outcome YES]`);
    process.exit(1);
  }
  
  const request: OrderRequest = {
    market: marketId,
    side,
    outcome: options.outcome,
    tokenId: options.tokenId,
    amount: options.amount,
    price: options.price,
    type: options.type || "GTC",
  };
  
  // Validate and align
  normalizeOrder(request.amount, request.price);
  
  console.log(`Placing ${side} order: ${request.amount} shares @ ${request.price}`);
  
  const result = await client.placeOrder(request);
  
  if (options.json) {
    output(result, options);
  } else {
    console.log(formatOrder(result));
  }
}

async function cmdCancel(args: string[], options: CliOptions): Promise<void> {
  const client = createClient(options);
  const orderId = args[0];
  
  if (!orderId) {
    console.error("Usage: cli.ts cancel <orderId>");
    process.exit(1);
  }
  
  await client.cancelOrder(orderId);
  console.log(`✓ Cancelled order ${orderId}`);
}

async function cmdOrders(args: string[], options: CliOptions): Promise<void> {
  const client = createClient(options);
  const orders = await client.getOrders();
  
  if (options.json) {
    output(orders, options);
  } else {
    console.log(`Open orders: ${orders.length}\n`);
    for (const order of orders) {
      console.log(formatOrder(order));
      console.log();
    }
  }
}

async function cmdBalance(args: string[], options: CliOptions): Promise<void> {
  const client = createClient(options);
  const balance = await client.getUSDCBalance();
  
  if (options.json) {
    output({ balance, raw: await client.getBalance() }, options);
  } else {
    console.log(`💰 USDC Balance: $${balance.toFixed(2)}`);
  }
}

async function cmdAllowance(args: string[], options: CliOptions): Promise<void> {
  const client = createClient(options);
  await client.updateAllowance();
  console.log("✓ Allowance updated");
}

async function cmdTrades(args: string[], options: CliOptions): Promise<void> {
  const client = createClient(options);
  const trades = await client.getTrades();
  
  if (options.json) {
    output(trades, options);
  } else {
    console.log(`Trade history: ${trades.length} trades\n`);
    for (const trade of trades.slice(0, options.limit || 20)) {
      console.log([
        `🔄 ${trade.side} ${trade.outcome}`,
        `   Size: ${trade.size} @ $${parseFloat(trade.price).toFixed(3)}`,
        `   Time: ${trade.match_time}`,
        `   Tx: ${trade.transaction_hash?.slice(0, 20)}...`,
      ].join("\n"));
      console.log();
    }
  }
}

async function cmdSeries(args: string[], options: CliOptions): Promise<void> {
  const slug = args[0];
  
  if (!slug) {
    console.error("Usage: cli.ts series <slug>");
    process.exit(1);
  }
  
  const series = await getSeries(slug);
  
  if (!series) {
    console.error(`Series not found: ${slug}`);
    process.exit(1);
  }
  
  if (options.json) {
    output(series, options);
  } else {
    console.log([
      `📅 Series: ${series.title}`,
      `   Slug: ${series.slug}`,
      `   End: ${series.endDate}`,
      `   Closed: ${series.closed ? "Yes" : "No"}`,
      `   Markets: ${series.markets.length}`,
      "",
      "   Markets:",
    ].join("\n"));
    
    for (const market of series.markets) {
      console.log(`\n${formatMarket(market)}`);
    }
  }
}

async function cmdFind(args: string[], options: CliOptions): Promise<void> {
  const query = args.join(" ");
  
  if (!query) {
    console.error("Usage: cli.ts find <query>");
    process.exit(1);
  }
  
  const results = await searchSeries(query, { limit: options.limit || 5 });
  
  if (options.json) {
    output(results, options);
  } else {
    console.log(`Found ${results.length} series:\n`);
    for (const series of results) {
      console.log([
        `📅 ${series.title}`,
        `   Slug: ${series.slug}`,
        `   Markets: ${series.markets.length}`,
        `   End: ${series.endDate}`,
      ].join("\n"));
      console.log();
    }
  }
}

async function cmdDerive(args: string[], options: CliOptions): Promise<void> {
  const client = createClient(options);
  const derived = await client.deriveApiKey();
  
  if (options.json) {
    output(derived, options);
  } else {
    console.log([
      "🔑 Derived API Key:",
      `   Key: ${derived.apiKey}`,
      `   Secret: ${derived.apiSecret.slice(0, 10)}...`,
      `   Passphrase: ${derived.apiPassphrase}`,
    ].join("\n"));
  }
}

function cmdHelp(): void {
  console.log(`
📈 Polylib CLI - Polymarket Trading Tool

Usage: bun cli.ts <command> [args] [options]

Commands:
  market <id>              Get market by condition ID
  markets                  List all markets
  search <query>           Search markets
  orderbook <marketId>     Show orderbook (use --outcome YES)
  buy <marketId>           Place buy order (--amount, --price, --outcome)
  sell <marketId>          Place sell order (--amount, --price, --outcome)
  cancel <orderId>         Cancel an order
  orders                   List open orders
  balance                  Show USDC balance
  allowance                Update USDC allowance
  trades                   Show trade history
  series <slug>            Get series by slug
  find <query>             Search for series
  derive                   Derive API key from signer
  help                     Show this help

Options:
  --key, -k <key>          API key (or POLY_API_KEY env)
  --secret, -s <secret>    API secret (or POLY_API_SECRET env)
  --pass, -p <pass>        API passphrase (or POLY_API_PASSPHRASE env)
  --outcome, -o <out>      Outcome name (YES, NO, etc.)
  --tokenId, -t <id>       Token ID (alternative to outcome)
  --amount, -a <n>         Order amount in shares
  --price <n>              Order price (0-1)
  --type <type>            Order type: GTC, FOK, IOC (default: GTC)
  --limit, -l <n>          Limit results
  --proxy <addr>           Gnosis Safe proxy address
  --rpc <url>              Polygon RPC URL
  --funder <addr>          Funder address
  --json, -j               Output JSON
  --raw, -r                Output raw JSON
  --help, -h               Show help

Examples:
  bun cli.ts market 0xabc123... -k KEY -s SECRET -p PASS
  bun cli.ts orderbook 0xabc... --outcome YES -k KEY -s SECRET -p PASS
  bun cli.ts buy 0xabc... -a 100 --price 0.65 -o YES -k KEY -s SECRET -p PASS
  bun cli.ts balance -k KEY -s SECRET -p PASS
  bun cli.ts series highest-temperature-in-london-on-february-3-2026
  bun cli.ts find "bitcoin price" -l 5
`);
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<void> {
  const { command, args, options } = parseArgs(process.argv.slice(2));
  
  try {
    switch (command) {
      case "market":
        await cmdMarket(args, options);
        break;
      case "markets":
        await cmdMarkets(args, options);
        break;
      case "search":
        await cmdSearch(args, options);
        break;
      case "orderbook":
      case "book":
        await cmdOrderbook(args, options);
        break;
      case "buy":
        await cmdPlaceOrder("BUY", args, options);
        break;
      case "sell":
        await cmdPlaceOrder("SELL", args, options);
        break;
      case "cancel":
        await cmdCancel(args, options);
        break;
      case "orders":
        await cmdOrders(args, options);
        break;
      case "balance":
        await cmdBalance(args, options);
        break;
      case "allowance":
        await cmdAllowance(args, options);
        break;
      case "trades":
        await cmdTrades(args, options);
        break;
      case "series":
        await cmdSeries(args, options);
        break;
      case "find":
        await cmdFind(args, options);
        break;
      case "derive":
        await cmdDerive(args, options);
        break;
      case "help":
      default:
        cmdHelp();
    }
  } catch (err: any) {
    if (options.json) {
      console.error(JSON.stringify({ error: err.message, code: err.code }, null, 2));
    } else {
      console.error(`❌ Error: ${err.message}`);
    }
    process.exit(1);
  }
}

main();
