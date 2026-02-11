/**
 * SDK-wide constants for Polypure.
 *
 * Contains API base URLs for the CLOB, WebSocket, and Gamma endpoints,
 * as well as the current package version string.
 */

/** Base URL for the Polymarket CLOB REST API. */
export const POLYMARKET_CLOB_HOST = "https://clob.polymarket.com";

/** WebSocket URL for real-time CLOB subscriptions. */
export const POLYMARKET_WS_URL = "wss://ws-subscriptions-clob.polymarket.com";

/** Base URL for the Gamma API (market discovery). */
export const GAMMA_API_BASE = "https://gamma-api.polymarket.com";

/** Base URL for the Data API (positions, profiles, etc.). */
export const DATA_API_BASE = "https://data-api.polymarket.com";

/** Current SDK version. */
export const VERSION = "1.5.0";
