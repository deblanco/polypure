/**
 * Unit tests for HMAC-SHA256 signing.
 */

import { describe, it, expect } from "bun:test";
import { signHmac, buildL2Message } from "../hmac.js";

describe("signHmac", () => {
  it("should sign a simple message correctly", async () => {
    // Test with a known secret and message
    // Secret: "test-secret" in base64
    const secret = btoa("test-secret");
    const message = "test-message";
    
    const signature = await signHmac(message, secret);
    
    // Signature should be a URL-safe base64 string
    expect(signature).toBeDefined();
    expect(typeof signature).toBe("string");
    expect(signature.length).toBeGreaterThan(0);
    // URL-safe base64 should not contain + or /
    // Padding (=) is preserved per CLOB API requirements
    expect(signature).not.toContain("+");
    expect(signature).not.toContain("/");
  });

  it("should produce consistent signatures for same input", async () => {
    const secret = btoa("consistent-secret");
    const message = "consistent-message";
    
    const sig1 = await signHmac(message, secret);
    const sig2 = await signHmac(message, secret);
    
    expect(sig1).toBe(sig2);
  });

  it("should produce different signatures for different messages", async () => {
    const secret = btoa("same-secret");
    
    const sig1 = await signHmac("message-one", secret);
    const sig2 = await signHmac("message-two", secret);
    
    expect(sig1).not.toBe(sig2);
  });

  it("should produce different signatures for different secrets", async () => {
    const message = "same-message";
    
    const sig1 = await signHmac(message, btoa("secret-one"));
    const sig2 = await signHmac(message, btoa("secret-two"));
    
    expect(sig1).not.toBe(sig2);
  });

  it("should handle empty message", async () => {
    const secret = btoa("test-secret");
    
    const signature = await signHmac("", secret);
    
    expect(signature).toBeDefined();
    expect(typeof signature).toBe("string");
    expect(signature.length).toBeGreaterThan(0);
  });
});

describe("buildL2Message", () => {
  it("should build message with all components", () => {
    const timestamp = 1234567890;
    const method = "GET";
    const requestPath = "/markets";
    const body = '{"key":"value"}';
    
    const message = buildL2Message(timestamp, method, requestPath, body);
    
    expect(message).toBe(`${timestamp}${method}${requestPath}${body}`);
  });

  it("should build message without body", () => {
    const timestamp = 1234567890;
    const method = "GET";
    const requestPath = "/markets";
    
    const message = buildL2Message(timestamp, method, requestPath);
    
    expect(message).toBe(`${timestamp}${method}${requestPath}`);
  });

  it("should convert method to uppercase", () => {
    const timestamp = 1234567890;
    const method = "post";
    const requestPath = "/order";
    
    const message = buildL2Message(timestamp, method, requestPath);
    
    expect(message).toContain("POST");
    expect(message).not.toContain("post");
  });

  it("should handle empty body", () => {
    const timestamp = 1234567890;
    const method = "GET";
    const requestPath = "/markets";
    
    const message = buildL2Message(timestamp, method, requestPath, "");
    
    expect(message).toBe(`${timestamp}${method}${requestPath}`);
  });

  it("should work with DELETE method", () => {
    const timestamp = 1234567890;
    const method = "DELETE";
    const requestPath = "/order";
    const body = '{"orderID":"123"}';
    
    const message = buildL2Message(timestamp, method, requestPath, body);
    
    expect(message).toBe(`${timestamp}DELETE${requestPath}${body}`);
  });
});
