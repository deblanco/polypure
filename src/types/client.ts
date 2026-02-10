/**
 * Client configuration types for Polymarket SDK.
 *
 * Defines authentication credentials, client options,
 * and internal HTTP request shapes.
 */

/**
 * Private key authentication config.
 *
 * API credentials (key, secret, passphrase) are derived automatically
 * at runtime using `createOrDeriveApiKey()`.
 */
export interface PrivateKeyConfig {
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

/**
 * Internal client options used after credential derivation.
 * Not part of the public API.
 *
 * All credentials are optional to support read-only clients
 * that only access public endpoints.
 */
export interface ClientOptions {
  apiKey?: string;
  apiSecret?: string;
  apiPassphrase?: string;
  signer?: any;
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
