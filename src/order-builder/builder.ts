/**
 * Order builder for creating and signing orders.
 *
 * Provides functions to build EIP-712 signed orders for the CTF Exchange.
 * Uses viem for consistent signing across environments.
 *
 * @module order-builder/builder
 */

import type { PrivateKeyAccount, WalletClient } from "viem";
import {
  ORDER_DOMAIN,
  ORDER_TYPES,
  OrderSide,
  SignatureType,
  DEFAULT_EXPIRATION,
  DEFAULT_FEE_RATE_BPS,
  DEFAULT_TAKER,
  NEG_RISK_EXCHANGE_ADDRESS,
  EXCHANGE_ADDRESS,
  type TickSize,
} from "./constants.js";
import { calculateBuyAmounts, calculateSellAmounts, generateSalt, alignPrice } from "./helpers.js";

/**
 * Signed order ready to be submitted to the CLOB API.
 */
export interface SignedOrder {
  /** Unique salt for order */
  salt: string;
  /** Maker address (order creator) */
  maker: string;
  /** Signer address (can be different from maker) */
  signer: string;
  /** Taker address (zero address for public orders) */
  taker: string;
  /** Token ID (condition ID for outcome) */
  tokenId: string;
  /** Maker amount in on-chain units */
  makerAmount: string;
  /** Taker amount in on-chain units */
  takerAmount: string;
  /** Order expiration timestamp */
  expiration: string;
  /** Order nonce */
  nonce: string;
  /** Fee rate in basis points */
  feeRateBps: string;
  /** Order side (0=BUY, 1=SELL) */
  side: string;
  /** Signature type (0=Browser Wallet, 1=Magic) */
  signatureType: string;
  /** EIP-712 signature */
  signature: string;
}

/**
 * Parameters for building a signed order.
 */
export interface BuildOrderParams {
  /** Signer account or wallet client */
  signer: PrivateKeyAccount | WalletClient;
  /** Token ID (condition ID) */
  tokenId: string;
  /** Order price (0-1) */
  price: number;
  /** Order size (number of outcome tokens) */
  size: number;
  /** Order side */
  side: "BUY" | "SELL";
  /** Market tick size */
  tickSize: TickSize;
  /** Fee rate in basis points (default: 50) */
  feeRateBps?: number;
  /** Order nonce (auto-generated if not provided) */
  nonce?: string;
  /** Order expiration timestamp (default: 365 days from now) */
  expiration?: number;
  /** Specific taker address (default: zero address for public orders) */
  taker?: string;
  /** Signature type (default: 1 for Magic/Email) */
  signatureType?: number;
  /** Funder address (if different from signer) */
  funderAddress?: string;
  /** Whether this is a negative risk market */
  negRisk?: boolean;
}

/**
 * Build and sign an order for the CTF Exchange.
 *
 * @param params - Order parameters
 * @returns Signed order ready for submission
 *
 * @example
 * ```typescript
 * const signedOrder = await buildSignedOrder({
 *   signer: account,
 *   tokenId: "0x...",
 *   price: 0.65,
 *   size: 100,
 *   side: "BUY",
 *   tickSize: "0.01",
 * });
 * ```
 */
export async function buildSignedOrder(params: BuildOrderParams): Promise<SignedOrder> {
  const {
    signer,
    tokenId,
    price,
    size,
    side,
    tickSize,
    feeRateBps = DEFAULT_FEE_RATE_BPS,
    nonce,
    expiration = DEFAULT_EXPIRATION,
    taker = DEFAULT_TAKER,
    signatureType = SignatureType.MAGIC,
    funderAddress,
    negRisk = false,
  } = params;

  // Get the signer address
  const signerAddress = getSignerAddress(signer);
  const makerAddress = funderAddress || signerAddress;

  // Align price to tick size
  const alignedPrice = alignPrice(price, tickSize);

  // Calculate amounts based on side
  const { rawMakerAmt, rawTakerAmt } =
    side === "BUY"
      ? calculateBuyAmounts(size, alignedPrice, tickSize)
      : calculateSellAmounts(size, alignedPrice, tickSize);

  // Generate salt and nonce
  const salt = generateSalt();
  const orderNonce = nonce || generateSalt();

  // Build order struct
  const order = {
    salt: BigInt(salt),
    maker: makerAddress as `0x${string}`,
    signer: signerAddress as `0x${string}`,
    taker: taker as `0x${string}`,
    tokenId: BigInt(tokenId),
    makerAmount: BigInt(rawMakerAmt),
    takerAmount: BigInt(rawTakerAmt),
    expiration: BigInt(expiration),
    nonce: BigInt(orderNonce),
    feeRateBps: BigInt(feeRateBps),
    side: side === "BUY" ? OrderSide.BUY : OrderSide.SELL,
    signatureType,
  };

  // Determine the correct exchange address
  const domain = {
    ...ORDER_DOMAIN,
    verifyingContract: (negRisk ? NEG_RISK_EXCHANGE_ADDRESS : EXCHANGE_ADDRESS) as `0x${string}`,
  };

  // Sign the order
  const signature = await signOrder(signer, domain, order);

  return {
    salt,
    maker: makerAddress,
    signer: signerAddress,
    taker,
    tokenId,
    makerAmount: rawMakerAmt,
    takerAmount: rawTakerAmt,
    expiration: expiration.toString(),
    nonce: orderNonce,
    feeRateBps: feeRateBps.toString(),
    side: order.side.toString(),
    signatureType: signatureType.toString(),
    signature,
  };
}

/**
 * Get the address from a signer.
 *
 * @param signer - Viem account or wallet client
 * @returns Signer address
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

/**
 * Sign an order using EIP-712.
 *
 * @param signer - Viem account or wallet client
 * @param domain - EIP-712 domain
 * @param order - Order struct to sign
 * @returns EIP-712 signature
 */
async function signOrder(
  signer: PrivateKeyAccount | WalletClient,
  domain: typeof ORDER_DOMAIN,
  order: {
    salt: bigint;
    maker: `0x${string}`;
    signer: `0x${string}`;
    taker: `0x${string}`;
    tokenId: bigint;
    makerAmount: bigint;
    takerAmount: bigint;
    expiration: bigint;
    nonce: bigint;
    feeRateBps: bigint;
    side: number;
    signatureType: number;
  }
): Promise<`0x${string}`> {
  // Check if signer is a PrivateKeyAccount (has signTypedData method)
  if ("signTypedData" in signer && typeof signer.signTypedData === "function") {
    const account = signer as PrivateKeyAccount;
    return account.signTypedData({
      domain,
      types: ORDER_TYPES,
      primaryType: "Order",
      message: order,
    });
  }

  // It's a WalletClient
  const walletClient = signer as WalletClient;
  if (!walletClient.account) {
    throw new Error("WalletClient must have an account configured");
  }

  return walletClient.signTypedData({
    domain,
    types: ORDER_TYPES,
    primaryType: "Order",
    message: order,
    account: walletClient.account,
  });
}
