/**
 * Authentication header builders for CLOB API.
 *
 * Provides functions to create L1 (EIP-712) and L2 (HMAC) headers
 * for authenticated API requests.
 *
 * @module auth/headers
 */

import type { PrivateKeyAccount, WalletClient } from "viem";
import { signClobAuth, generateNonce, getTimestamp } from "./eip712.js";
import { signHmac, buildL2Message } from "./hmac.js";

/**
 * API credentials for L2 authentication.
 */
export interface ApiCredentials {
  /** API key */
  key: string;
  /** Base64-encoded API secret */
  secret: string;
  /** API passphrase */
  passphrase: string;
}

/**
 * L1 headers for API key creation/derivation (EIP-712 signed).
 */
export interface L1Headers {
  /** Wallet address */
  POLY_ADDRESS: string;
  /** EIP-712 signature */
  POLY_SIGNATURE: string;
  /** Timestamp in milliseconds */
  POLY_TIMESTAMP: string;
  /** Random nonce */
  POLY_NONCE: string;
}

/**
 * L2 headers for authenticated API requests (HMAC signed).
 */
export interface L2Headers {
  /** Wallet address */
  POLY_ADDRESS: string;
  /** HMAC signature */
  POLY_SIGNATURE: string;
  /** Timestamp in seconds */
  POLY_TIMESTAMP: string;
  /** API key */
  POLY_API_KEY: string;
  /** API passphrase */
  POLY_PASSPHRASE: string;
}

/**
 * Create L1 authentication headers for API key derivation.
 *
 * These headers prove wallet ownership via EIP-712 signing and are used
 * when creating or deriving API keys from the CLOB API.
 *
 * @param signer - Viem account or wallet client
 * @param nonce - Optional nonce (auto-generated if not provided)
 * @param timestamp - Optional timestamp (auto-generated if not provided)
 * @returns L1 authentication headers
 *
 * @example
 * ```typescript
 * const headers = await createL1Headers(account);
 * // { POLY_ADDRESS: "0x...", POLY_SIGNATURE: "0x...", POLY_TIMESTAMP: "1234567890", POLY_NONCE: "12345" }
 * ```
 */
export async function createL1Headers(
  signer: PrivateKeyAccount | WalletClient,
  nonce?: number,
  timestamp?: number
): Promise<L1Headers> {
  const ts = timestamp || getTimestamp();
  const n = nonce || generateNonce();
  
  const signature = await signClobAuth(signer, ts, n);
  const address = getSignerAddress(signer);
  
  return {
    POLY_ADDRESS: address,
    POLY_SIGNATURE: signature,
    POLY_TIMESTAMP: ts.toString(),
    POLY_NONCE: n.toString(),
  };
}

/**
 * Create L2 authentication headers for API requests.
 *
 * These headers authenticate requests using HMAC-SHA256 signing
 * with the API credentials. The address is required by the CLOB API.
 *
 * @param address - Wallet address of the authenticated user
 * @param creds - API credentials (key, secret, passphrase)
 * @param method - HTTP method (GET, POST, DELETE, etc.)
 * @param requestPath - API endpoint path (e.g., "/order")
 * @param body - Optional request body as a string (already JSON-stringified if applicable)
 * @param timestamp - Optional timestamp (auto-generated if not provided)
 * @returns L2 authentication headers
 *
 * @example
 * ```typescript
 * const headers = await createL2Headers("0x...", creds, "GET", "/markets");
 * ```
 */
export async function createL2Headers(
  address: string,
  creds: ApiCredentials,
  method: string,
  requestPath: string,
  body?: string,
  timestamp?: number
): Promise<L2Headers> {
  const ts = timestamp || Math.floor(Date.now() / 1000);

  // Build the HMAC message: timestamp + method + path [+ body]
  // Body is only appended if defined (not for GET requests)
  const message = buildL2Message(ts, method, requestPath, body);
  const signature = await signHmac(message, creds.secret);
  
  return {
    POLY_ADDRESS: address,
    POLY_SIGNATURE: signature,
    POLY_TIMESTAMP: ts.toString(),
    POLY_API_KEY: creds.key,
    POLY_PASSPHRASE: creds.passphrase,
  };
}

/**
 * Get the address from a signer (account or wallet client).
 *
 * @param signer - Viem account or wallet client
 * @returns Wallet address
 */
function getSignerAddress(signer: PrivateKeyAccount | WalletClient): string {
  if ("address" in signer) {
    // PrivateKeyAccount
    return signer.address;
  }

  // WalletClient
  if (signer.account) {
    return signer.account.address;
  }

  throw new Error("Signer must have an address");
}
