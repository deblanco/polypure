/**
 * Orderbook types for Polymarket SDK.
 *
 * Represents a price level and the full orderbook
 * snapshot for a given asset.
 */

/** A single price level in the orderbook (bid or ask). */
export interface OrderbookLevel {
  price: number;
  size: number;
}

/** Full orderbook snapshot for a token. */
export interface Orderbook {
  market: string;
  asset_id: string;
  bids: OrderbookLevel[];
  asks: OrderbookLevel[];
  hash: string;
}
