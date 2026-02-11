/**
 * API credentials management for CLOB authentication.
 *
 * Handles API key derivation, creation, and lifecycle management.
 * API keys are derived from wallet signatures using EIP-712.
 *
 * @module auth/credentials
 */

import type { PrivateKeyAccount, WalletClient } from "viem";
import { httpRequest } from "../http.js";
import { createL1Headers } from "./headers.js";
import type { ApiCredentials } from "./headers.js";

/**
 * Response from API key derivation endpoint.
 */
interface DeriveApiKeyResponse {
  /** API key */
  apiKey: string;
  /** Base64-encoded API secret */
  secret: string;
  /** API passphrase */
  passphrase: string;
}

/**
 * Derive existing API key for a wallet.
 *
 * Makes a request to the CLOB API to retrieve existing API credentials
 * associated with the wallet address. Requires EIP-712 signature.
 *
 * @param host - CLOB API host (e.g., "https://clob.polymarket.com")
 * @param signer - Viem account or wallet client
 * @returns API credentials (key, secret, passphrase)
 *
 * @example
 * ```typescript
 * const creds = await deriveApiKey("https://clob.polymarket.com", account);
 * ```
 */
export async function deriveApiKey(
  host: string,
  signer: PrivateKeyAccount | WalletClient
): Promise<ApiCredentials> {
  const headers = await createL1Headers(signer);
  
  const response = await httpRequest<DeriveApiKeyResponse>(
    `${host}/auth/derive-api-key`,
    {
      method: "GET",
      headers: {
        "POLY_ADDRESS": headers.POLY_ADDRESS,
        "POLY_SIGNATURE": headers.POLY_SIGNATURE,
        "POLY_TIMESTAMP": headers.POLY_TIMESTAMP,
        "POLY_NONCE": headers.POLY_NONCE,
      },
    }
  );
  
  return {
    key: response.apiKey,
    secret: response.secret,
    passphrase: response.passphrase,
  };
}

/**
 * Create new API key for a wallet.
 *
 * Makes a request to the CLOB API to create new API credentials.
 * Requires EIP-712 signature. Will fail if API keys already exist.
 *
 * @param host - CLOB API host (e.g., "https://clob.polymarket.com")
 * @param signer - Viem account or wallet client
 * @returns API credentials (key, secret, passphrase)
 *
 * @example
 * ```typescript
 * const creds = await createApiKey("https://clob.polymarket.com", account);
 * ```
 */
export async function createApiKey(
  host: string,
  signer: PrivateKeyAccount | WalletClient
): Promise<ApiCredentials> {
  const headers = await createL1Headers(signer);
  
  const response = await httpRequest<DeriveApiKeyResponse>(
    `${host}/auth/api-key`,
    {
      method: "POST",
      headers: {
        "POLY_ADDRESS": headers.POLY_ADDRESS,
        "POLY_SIGNATURE": headers.POLY_SIGNATURE,
        "POLY_TIMESTAMP": headers.POLY_TIMESTAMP,
        "POLY_NONCE": headers.POLY_NONCE,
      },
    }
  );
  
  return {
    key: response.apiKey,
    secret: response.secret,
    passphrase: response.passphrase,
  };
}

/**
 * Create or derive API key for a wallet.
 *
 * Attempts to create a new API key first, then falls back to deriving
 * an existing key if creation fails (e.g., key already exists).
 *
 * @param host - CLOB API host (e.g., "https://clob.polymarket.com")
 * @param signer - Viem account or wallet client
 * @returns API credentials (key, secret, passphrase)
 *
 * @example
 * ```typescript
 * const creds = await createOrDeriveApiKey("https://clob.polymarket.com", account);
 * ```
 */
export async function createOrDeriveApiKey(
  host: string,
  signer: PrivateKeyAccount | WalletClient
): Promise<ApiCredentials> {
  try {
    // Try to create new API key first
    return await createApiKey(host, signer);
  } catch (error) {
    // If creation fails (likely because key already exists), derive existing
    return await deriveApiKey(host, signer);
  }
}
