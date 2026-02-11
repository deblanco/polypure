/**
 * Constants for order building and signing.
 *
 * Contains Polygon mainnet contract addresses, EIP-712 domain configuration,
 * and rounding settings for different tick sizes.
 *
 * @module order-builder/constants
 */

import type { TypedDataDomain, TypedDataParameter } from "viem";

// ============================================================================
// Polygon Mainnet Contract Addresses
// ============================================================================

/** CTF Exchange contract address */
export const EXCHANGE_ADDRESS = "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E";

/** Negative Risk Exchange contract address */
export const NEG_RISK_EXCHANGE_ADDRESS = "0xC5d563A36AE78145C45a50134d48A1215220f80a";

/** Negative Risk Adapter contract address */
export const NEG_RISK_ADAPTER_ADDRESS = "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296";

/** USDC collateral token address */
export const COLLATERAL_TOKEN = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";

/** Conditional tokens contract address */
export const CONDITIONAL_TOKEN = "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045";

/** USDC decimals (6) */
export const COLLATERAL_TOKEN_DECIMALS = 6;

/** Conditional token decimals (6) */
export const CONDITIONAL_TOKEN_DECIMALS = 6;

/** Polygon chain ID */
export const CHAIN_ID = 137;

// ============================================================================
// EIP-712 Domain and Types
// ============================================================================

/**
 * EIP-712 domain for CTF Exchange order signing.
 */
export const ORDER_DOMAIN: TypedDataDomain = {
  name: "Exchange",
  version: "1",
  chainId: CHAIN_ID,
  verifyingContract: EXCHANGE_ADDRESS,
};

/**
 * EIP-712 types for order signing.
 */
export const ORDER_TYPES: Record<string, TypedDataParameter[]> = {
  Order: [
    { name: "salt", type: "uint256" },
    { name: "maker", type: "address" },
    { name: "signer", type: "address" },
    { name: "taker", type: "address" },
    { name: "tokenId", type: "uint256" },
    { name: "makerAmount", type: "uint256" },
    { name: "takerAmount", type: "uint256" },
    { name: "expiration", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "feeRateBps", type: "uint256" },
    { name: "side", type: "uint8" },
    { name: "signatureType", type: "uint8" },
  ],
};

// ============================================================================
// Rounding Configuration
// ============================================================================

/**
 * Supported tick sizes for price granularity.
 */
export type TickSize = "0.1" | "0.01" | "0.001" | "0.0001";

/**
 * Rounding configuration for each tick size.
 * Defines the number of decimal places for rounding calculations.
 */
export const ROUNDING_CONFIG: Record<TickSize, { decimals: number }> = {
  "0.1": { decimals: 1 },
  "0.01": { decimals: 2 },
  "0.001": { decimals: 3 },
  "0.0001": { decimals: 4 },
};

/**
 * Order side enumeration.
 */
export enum OrderSide {
  BUY = 0,
  SELL = 1,
}

/**
 * Signature type enumeration.
 */
export enum SignatureType {
  /** Browser wallet (MetaMask, Coinbase Wallet, etc.) */
  BROWSER_WALLET = 0,
  /** Magic/Email login */
  MAGIC = 1,
}

// ============================================================================
// Default Values
// ============================================================================

/** Default expiration time in seconds (365 days from now) */
export const DEFAULT_EXPIRATION = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;

/** Default fee rate in basis points (0.5%) */
export const DEFAULT_FEE_RATE_BPS = 50;

/** Default taker address (zero address for public orders) */
export const DEFAULT_TAKER = "0x0000000000000000000000000000000000000000";
