/**
 * Gamma API functions for Polypure SDK.
 *
 * Provides market discovery through the Polymarket Gamma API,
 * including fetching and searching series (events) and parsing
 * their nested market/outcome structures.
 */

import { GAMMA_API_BASE } from "./constants.js";
import { httpRequest } from "./http.js";
import type {
  GammaEvent,
  GammaMarket,
  Series,
  MarketInfo,
  OutcomeInfo,
} from "./types/market.js";

// ============================================================================
// Public API
// ============================================================================

/**
 * Fetch a series (event) by its slug from the Gamma API.
 *
 * @param slug - URL slug identifying the series.
 * @returns Parsed Series object, or null if not found.
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
 * Search for series (events) matching a text query.
 *
 * @param query - Free-text search string.
 * @param options - Optional limit and active-only filter.
 * @returns Array of matching Series objects.
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
    order: "createdAt",
    ascending: "false",
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

// ============================================================================
// Parsing Helpers
// ============================================================================

/**
 * Parse a raw Gamma API event into a normalised Series object.
 *
 * @param event - Raw event from the Gamma API.
 * @returns Normalised Series with parsed market info.
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
 * Parse a raw Gamma market into normalised MarketInfo.
 *
 * Returns null when the market has no CLOB token IDs
 * (i.e., it is not tradeable on the CLOB).
 *
 * @param market - Raw market from the Gamma API.
 * @returns Normalised MarketInfo, or null if untradeable.
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
 * Parse a JSON-encoded array of token ID strings.
 *
 * @param json - Raw JSON string (or null) from the Gamma API.
 * @returns Array of token ID strings.
 */
export function parseTokenIds(json: string | null): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Parse a JSON-encoded array of outcome name strings.
 *
 * @param json - Raw JSON string (or null/undefined) from the Gamma API.
 * @returns Array of outcome name strings.
 */
export function parseOutcomes(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed)
      ? parsed.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
}
