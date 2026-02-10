/**
 * Order-related types for Polymarket SDK.
 *
 * Defines order sides, types, statuses, and the request/response
 * shapes used when placing and managing orders.
 */

/** Direction of an order: buy or sell. */
export type OrderSide = "BUY" | "SELL";

/** Time-in-force type for an order. */
export type OrderType = "GTC" | "FOK" | "IOC";

/** Lifecycle status of an order. */
export type OrderStatus = "PENDING" | "OPEN" | "FILLED" | "PARTIAL" | "CANCELLED" | "FAILED";

/** An existing order on the CLOB. */
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

/**
 * Parameters for placing a new order.
 * Provide either `outcome` (e.g., "YES") or `tokenId` directly.
 */
export interface OrderRequest {
  market: string;
  side: OrderSide;
  outcome?: string;  // e.g., "YES", "Over 12.5°C", etc.
  tokenId?: string;  // direct token ID
  amount: number;
  price: number;
  type?: OrderType;
}

/** Response returned after placing an order. */
export interface OrderResponse {
  order_id: string;
  status: string;
  filled_size: number;
  remaining_size: number;
}
