/**
 * Market-related types for Polymarket SDK.
 *
 * Covers core market data (Token, Market) and Gamma API types
 * used for market discovery (GammaEvent, GammaMarket, Series, MarketInfo, OutcomeInfo).
 */

// ============================================================================
// Core Market Types
// ============================================================================

/** Represents a single outcome token within a market. */
export interface Token {
  token_id: string;
  outcome: string;
  price: number;
  winner: boolean;
}

/** Full market data as returned by the CLOB API. */
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

// ============================================================================
// Gamma API Types (for market discovery)
// ============================================================================

/** Event as returned by the Gamma API. */
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

/** Market as returned by the Gamma API. */
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

/** Aggregated series (event) with parsed market info. */
export interface Series {
  id: string;
  title: string;
  slug: string;
  description?: string;
  endDate: string;
  closed: boolean;
  markets: MarketInfo[];
}

/** Parsed market info derived from a GammaMarket. */
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

/** Individual outcome within a parsed market. */
export interface OutcomeInfo {
  tokenId: string;
  name: string;
  price?: number;
}
