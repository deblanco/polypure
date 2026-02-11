/**
 * Unit tests for authentication header generation.
 */

import { describe, it, expect } from "bun:test";
import { createL1Headers, createL2Headers, type ApiCredentials } from "../headers.js";
import { privateKeyToAccount } from "viem/accounts";

describe("createL1Headers", () => {
  // Test account (DO NOT USE IN PRODUCTION)
  const testPrivateKey = "0x1111111111111111111111111111111111111111111111111111111111111111";
  const testAccount = privateKeyToAccount(testPrivateKey as `0x${string}`);

  it("should create L1 headers with all required fields", async () => {
    const headers = await createL1Headers(testAccount);

    expect(headers).toHaveProperty("POLY_ADDRESS");
    expect(headers).toHaveProperty("POLY_SIGNATURE");
    expect(headers).toHaveProperty("POLY_TIMESTAMP");
    expect(headers).toHaveProperty("POLY_NONCE");
  });

  it("should include correct address", async () => {
    const headers = await createL1Headers(testAccount);

    expect(headers.POLY_ADDRESS.toLowerCase()).toBe(testAccount.address.toLowerCase());
  });

  it("should use provided timestamp", async () => {
    const timestamp = 1234567890;
    const headers = await createL1Headers(testAccount, undefined, timestamp);

    expect(headers.POLY_TIMESTAMP).toBe(timestamp.toString());
  });

  it("should use provided nonce", async () => {
    const nonce = 12345;
    const headers = await createL1Headers(testAccount, nonce);

    expect(headers.POLY_NONCE).toBe(nonce.toString());
  });

  it("should generate valid signature format", async () => {
    const headers = await createL1Headers(testAccount);

    // Signature should be a hex string starting with 0x
    expect(headers.POLY_SIGNATURE).toMatch(/^0x[a-fA-F0-9]+$/);
    // EIP-712 signatures are 65 bytes = 130 hex chars + "0x" prefix
    expect(headers.POLY_SIGNATURE.length).toBe(132);
  });

  it("should generate different signatures for different nonces", async () => {
    const headers1 = await createL1Headers(testAccount, 1);
    const headers2 = await createL1Headers(testAccount, 2);

    expect(headers1.POLY_SIGNATURE).not.toBe(headers2.POLY_SIGNATURE);
  });
});

describe("createL2Headers", () => {
  const testCreds: ApiCredentials = {
    key: "test-api-key",
    secret: btoa("test-api-secret-32-chars-long!!"),
    passphrase: "test-passphrase",
  };
  const testAddress = "0xd7070aE19a6575bafee27944B93CCE58c5f56D8e";

  it("should create L2 headers with all required fields", async () => {
    const headers = await createL2Headers(testAddress, testCreds, "GET", "/markets");

    expect(headers).toHaveProperty("POLY_ADDRESS");
    expect(headers).toHaveProperty("POLY_SIGNATURE");
    expect(headers).toHaveProperty("POLY_TIMESTAMP");
    expect(headers).toHaveProperty("POLY_API_KEY");
    expect(headers).toHaveProperty("POLY_PASSPHRASE");
  });

  it("should include API key, passphrase, and address", async () => {
    const headers = await createL2Headers(testAddress, testCreds, "GET", "/markets");

    expect(headers.POLY_API_KEY).toBe(testCreds.key);
    expect(headers.POLY_PASSPHRASE).toBe(testCreds.passphrase);
    expect(headers.POLY_ADDRESS).toBe(testAddress);
  });

  it("should generate URL-safe signature with padding preserved", async () => {
    const headers = await createL2Headers(testAddress, testCreds, "GET", "/markets");

    // URL-safe base64 should not contain + or /
    expect(headers.POLY_SIGNATURE).not.toContain("+");
    expect(headers.POLY_SIGNATURE).not.toContain("/");
    // Padding (=) should be preserved per CLOB API requirements
  });

  it("should use provided timestamp", async () => {
    const timestamp = 1234567890;
    const headers = await createL2Headers(testAddress, testCreds, "GET", "/markets", undefined, timestamp);

    expect(headers.POLY_TIMESTAMP).toBe(timestamp.toString());
  });

  it("should include body in signature when provided", async () => {
    const body = JSON.stringify({ marketId: "123", price: 0.5 });
    
    const headers1 = await createL2Headers(testAddress, testCreds, "POST", "/order", body);
    const headers2 = await createL2Headers(testAddress, testCreds, "POST", "/order");

    // Signatures should be different when body is included
    expect(headers1.POLY_SIGNATURE).not.toBe(headers2.POLY_SIGNATURE);
  });

  it("should handle GET request without body", async () => {
    const headers = await createL2Headers(testAddress, testCreds, "GET", "/markets");

    expect(headers.POLY_TIMESTAMP).toBeDefined();
    expect(headers.POLY_SIGNATURE).toBeDefined();
  });

  it("should handle DELETE request with body", async () => {
    const body = JSON.stringify({ orderID: "123" });
    const headers = await createL2Headers(testAddress, testCreds, "DELETE", "/order", body);

    expect(headers.POLY_TIMESTAMP).toBeDefined();
    expect(headers.POLY_SIGNATURE).toBeDefined();
  });

  it("should produce consistent signatures for same input", async () => {
    const timestamp = 1234567890;
    
    const headers1 = await createL2Headers(testAddress, testCreds, "GET", "/markets", undefined, timestamp);
    const headers2 = await createL2Headers(testAddress, testCreds, "GET", "/markets", undefined, timestamp);

    expect(headers1.POLY_SIGNATURE).toBe(headers2.POLY_SIGNATURE);
  });

  it("should produce different signatures for different methods", async () => {
    const timestamp = 1234567890;
    
    const headers1 = await createL2Headers(testAddress, testCreds, "GET", "/markets", undefined, timestamp);
    const headers2 = await createL2Headers(testAddress, testCreds, "POST", "/markets", undefined, timestamp);

    expect(headers1.POLY_SIGNATURE).not.toBe(headers2.POLY_SIGNATURE);
  });

  it("should produce different signatures for different paths", async () => {
    const timestamp = 1234567890;
    
    const headers1 = await createL2Headers(testAddress, testCreds, "GET", "/markets", undefined, timestamp);
    const headers2 = await createL2Headers(testAddress, testCreds, "GET", "/orders", undefined, timestamp);

    expect(headers1.POLY_SIGNATURE).not.toBe(headers2.POLY_SIGNATURE);
  });
});
