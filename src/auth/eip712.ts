/**
 * EIP-712 signing for L1 API authentication.
 *
 * This module handles EIP-712 typed data signing for API key derivation
 * and authentication. Uses viem for consistent signing across environments.
 *
 * @module auth/eip712
 */

import type { PrivateKeyAccount, WalletClient } from "viem";

/**
 * CLOB authentication domain for EIP-712 signing.
 *
 * Used when creating or deriving API keys. The signature proves
 * wallet ownership to the CLOB API.
 */
export const CLOB_AUTH_DOMAIN = {
  name: "ClobAuthDomain",
  version: "1",
  chainId: 137, // Polygon mainnet
} as const;

/**
 * EIP-712 types for CLOB authentication.
 *
 * The message attests that the signer controls the given wallet address.
 */
export const CLOB_AUTH_TYPES = {
  ClobAuth: [
    { name: "address", type: "address" },
    { name: "timestamp", type: "string" },
    { name: "nonce", type: "uint256" },
    { name: "message", type: "string" },
  ],
} as const;

/**
 * Sign CLOB authentication message using EIP-712.
 *
 * This signature is used to prove wallet ownership when creating or
 * deriving API keys from the CLOB API.
 *
 * @param signer - Viem account or wallet client
 * @param timestamp - Unix timestamp in milliseconds
 * @param nonce - Random nonce for replay protection
 * @returns EIP-712 signature
 *
 * @example
 * ```typescript
 * const signature = await signClobAuth(account, Date.now(), 123456);
 * ```
 */
export async function signClobAuth(
  signer: PrivateKeyAccount | WalletClient,
  timestamp: number,
  nonce: number
): Promise<`0x${string}`> {
  // Get the wallet address from the signer
  const address = getSignerAddress(signer);

  // Build the typed data message
  const message = {
    address,
    timestamp: timestamp.toString(),
    nonce: BigInt(nonce),
    message: "This message attests that I control the given wallet",
  };

  // Check if signer is a PrivateKeyAccount (has signTypedData method)
  if ("signTypedData" in signer && typeof signer.signTypedData === "function") {
    // It's a PrivateKeyAccount
    const account = signer as PrivateKeyAccount;
    return account.signTypedData({
      domain: CLOB_AUTH_DOMAIN,
      types: CLOB_AUTH_TYPES,
      primaryType: "ClobAuth",
      message,
    });
  }

  // It's a WalletClient - use viem's signTypedData
  const walletClient = signer as WalletClient;
  if (!walletClient.account) {
    throw new Error("WalletClient must have an account configured");
  }

  return walletClient.signTypedData({
    domain: CLOB_AUTH_DOMAIN,
    types: CLOB_AUTH_TYPES,
    primaryType: "ClobAuth",
    message,
    account: walletClient.account,
  });
}

/**
 * Get the address from a signer (account or wallet client).
 *
 * @param signer - Viem account or wallet client
 * @returns Wallet address
 */
function getSignerAddress(signer: PrivateKeyAccount | WalletClient): `0x${string}` {
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

/**
 * Generate a random nonce for authentication.
 *
 * @returns Random 32-byte nonce as a number
 */
export function generateNonce(): number {
  // Generate a random 32-bit integer
  return Math.floor(Math.random() * 2 ** 32);
}

/**
 * Get current timestamp in milliseconds.
 *
 * @returns Unix timestamp in milliseconds
 */
export function getTimestamp(): number {
  return Date.now();
}
