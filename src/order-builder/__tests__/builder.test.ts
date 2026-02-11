/**
 * Unit tests for order builder.
 */

import { describe, it, expect } from "bun:test";
import { buildSignedOrder, type BuildOrderParams } from "../builder.js";
import { privateKeyToAccount } from "viem/accounts";

describe("buildSignedOrder", () => {
  // Test account (DO NOT USE IN PRODUCTION)
  const testPrivateKey = "0x1111111111111111111111111111111111111111111111111111111111111111";
  const testAccount = privateKeyToAccount(testPrivateKey as `0x${string}`);

  const baseParams: BuildOrderParams = {
    signer: testAccount,
    tokenId: "12345",
    price: 0.65,
    size: 100,
    side: "BUY",
    tickSize: "0.01",
  };

  it("should build a BUY order with all required fields", async () => {
    const order = await buildSignedOrder(baseParams);

    expect(order).toHaveProperty("salt");
    expect(order).toHaveProperty("maker");
    expect(order).toHaveProperty("signer");
    expect(order).toHaveProperty("taker");
    expect(order).toHaveProperty("tokenId");
    expect(order).toHaveProperty("makerAmount");
    expect(order).toHaveProperty("takerAmount");
    expect(order).toHaveProperty("expiration");
    expect(order).toHaveProperty("nonce");
    expect(order).toHaveProperty("feeRateBps");
    expect(order).toHaveProperty("side");
    expect(order).toHaveProperty("signatureType");
    expect(order).toHaveProperty("signature");
  });

  it("should set correct addresses", async () => {
    const order = await buildSignedOrder(baseParams);

    expect(order.maker.toLowerCase()).toBe(testAccount.address.toLowerCase());
    expect(order.signer.toLowerCase()).toBe(testAccount.address.toLowerCase());
  });

  it("should set BUY side correctly", async () => {
    const order = await buildSignedOrder(baseParams);

    expect(order.side).toBe("0"); // OrderSide.BUY = 0
  });

  it("should set SELL side correctly", async () => {
    const order = await buildSignedOrder({
      ...baseParams,
      side: "SELL",
    });

    expect(order.side).toBe("1"); // OrderSide.SELL = 1
  });

  it("should calculate BUY amounts correctly", async () => {
    const order = await buildSignedOrder(baseParams);

    // 100 size * 0.65 price = 65 USDC (makerAmount)
    // takerAmount = 100 YES tokens
    expect(order.makerAmount).toBe("65000000"); // 65 * 1e6
    expect(order.takerAmount).toBe("100000000"); // 100 * 1e6
  });

  it("should calculate SELL amounts correctly", async () => {
    const order = await buildSignedOrder({
      ...baseParams,
      side: "SELL",
    });

    // For SELL: makerAmount = 100 YES, takerAmount = 65 USDC
    expect(order.makerAmount).toBe("100000000"); // 100 * 1e6
    expect(order.takerAmount).toBe("65000000"); // 65 * 1e6
  });

  it("should generate a valid EIP-712 signature", async () => {
    const order = await buildSignedOrder(baseParams);

    // Signature should be a hex string starting with 0x
    expect(order.signature).toMatch(/^0x[a-fA-F0-9]+$/);
    // EIP-712 signatures are 65 bytes = 130 hex chars + "0x" prefix
    expect(order.signature.length).toBe(132);
  });

  it("should use custom funder address", async () => {
    const customFunder = "0x2222222222222222222222222222222222222222";
    const order = await buildSignedOrder({
      ...baseParams,
      funderAddress: customFunder,
    });

    expect(order.maker.toLowerCase()).toBe(customFunder.toLowerCase());
    // Signer should still be the original account
    expect(order.signer.toLowerCase()).toBe(testAccount.address.toLowerCase());
  });

  it("should use custom expiration", async () => {
    const customExpiration = 1234567890;
    const order = await buildSignedOrder({
      ...baseParams,
      expiration: customExpiration,
    });

    expect(order.expiration).toBe(customExpiration.toString());
  });

  it("should use custom fee rate", async () => {
    const customFeeRate = 100; // 1%
    const order = await buildSignedOrder({
      ...baseParams,
      feeRateBps: customFeeRate,
    });

    expect(order.feeRateBps).toBe(customFeeRate.toString());
  });

  it("should use custom signature type", async () => {
    const order = await buildSignedOrder({
      ...baseParams,
      signatureType: 0, // Browser Wallet
    });

    expect(order.signatureType).toBe("0");
  });

  it("should use negative risk exchange when specified", async () => {
    // We can't easily verify the verifyingContract without mocking,
    // but we can verify the order still builds successfully
    const order = await buildSignedOrder({
      ...baseParams,
      negRisk: true,
    });

    expect(order.signature).toMatch(/^0x[a-fA-F0-9]+$/);
  });

  it("should align price to tick size", async () => {
    const order = await buildSignedOrder({
      ...baseParams,
      price: 0.657, // Will be aligned to 0.65 for 0.01 tick size
      tickSize: "0.01",
    });

    // Maker amount should reflect aligned price (100 * 0.65 = 65)
    expect(order.makerAmount).toBe("65000000");
  });

  it("should use custom nonce when provided", async () => {
    const customNonce = "1234567890";
    const order = await buildSignedOrder({
      ...baseParams,
      nonce: customNonce,
    });

    expect(order.nonce).toBe(customNonce);
  });

  it("should use custom taker address", async () => {
    const customTaker = "0x3333333333333333333333333333333333333333";
    const order = await buildSignedOrder({
      ...baseParams,
      taker: customTaker,
    });

    expect(order.taker.toLowerCase()).toBe(customTaker.toLowerCase());
  });

  it("should generate unique orders for each call", async () => {
    const order1 = await buildSignedOrder(baseParams);
    const order2 = await buildSignedOrder(baseParams);

    // Salts should be different
    expect(order1.salt).not.toBe(order2.salt);
    // Signatures should be different
    expect(order1.signature).not.toBe(order2.signature);
  });
});
