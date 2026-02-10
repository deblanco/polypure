/**
 * Client configuration types for Polymarket SDK.
 *
 * Defines authentication credentials, client options,
 * and internal HTTP request shapes.
 */

/** API authentication credentials. */
export interface AuthConfig {
  apiKey: string;
  apiSecret: string;
  apiPassphrase: string;
  proxyAddress?: string;
}

/** Full configuration options for PolymarketClient. */
export interface ClientOptions extends AuthConfig {
  signer?: any;
  rpcUrl?: string;
  signatureType?: number;
  funderAddress?: string;
  baseUrl?: string;
}

/** Internal HTTP request configuration. */
export interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}
