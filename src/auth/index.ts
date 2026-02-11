/**
 * Authentication module for Polypure SDK.
 *
 * Provides CLOB API authentication via L1 (EIP-712) and L2 (HMAC) signing.
 * Works in both browser and Node.js environments using Web Crypto API.
 *
 * @example
 * ```typescript
 * import { createOrDeriveApiKey, createL2Headers } from "polypure/auth";
 *
 * // Get API credentials
 * const creds = await createOrDeriveApiKey("https://clob.polymarket.com", account);
 *
 * // Sign a request
 * const headers = await createL2Headers(creds, "GET", "/markets");
 * ```
 */

// HMAC signing
export { signHmac, buildL2Message } from "./hmac.js";

// EIP-712 signing
export {
  signClobAuth,
  generateNonce,
  getTimestamp,
  CLOB_AUTH_DOMAIN,
  CLOB_AUTH_TYPES,
} from "./eip712.js";

// Header builders
export {
  createL1Headers,
  createL2Headers,
  type ApiCredentials,
  type L1Headers,
  type L2Headers,
} from "./headers.js";

// Credentials management
export {
  deriveApiKey,
  createApiKey,
  createOrDeriveApiKey,
} from "./credentials.js";
