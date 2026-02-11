/**
 * HMAC-SHA256 signing using Web Crypto API.
 *
 * This module provides HMAC signing for L2 API authentication headers.
 * Uses crypto.subtle which works in both browsers and Node.js 18+.
 *
 * @module auth/hmac
 */

/**
 * Sign a message using HMAC-SHA256 with the provided secret key.
 *
 * @param message - The message to sign (typically timestamp + method + path + body)
 * @param secret - Base64-encoded API secret key
 * @returns URL-safe base64-encoded signature
 *
 * @example
 * ```typescript
 * const signature = await signHmac("GET/api/v1/markets", "base64secret");
 * ```
 */
export async function signHmac(message: string, secret: string): Promise<string> {
  // Decode base64 secret to raw bytes
  const secretBytes = base64ToBytes(secret);

  // Import the key for HMAC signing
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    secretBytes.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  // Encode the message
  const messageBytes = new TextEncoder().encode(message);
  
  // Sign the message
  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageBytes);
  
  // Convert to base64 and make URL-safe
  const signatureBytes = new Uint8Array(signatureBuffer);
  return bytesToBase64UrlSafe(signatureBytes);
}

/**
 * Convert base64 string to Uint8Array.
 * Handles both standard and URL-safe base64.
 *
 * @param base64 - Base64-encoded string (standard or URL-safe)
 * @returns Decoded bytes
 */
function base64ToBytes(base64: string): Uint8Array {
  // Convert URL-safe base64 to standard base64
  // Replace - with +, _ with /
  let normalized = base64.replace(/-/g, "+").replace(/_/g, "/");

  // Add padding if needed
  while (normalized.length % 4 !== 0) {
    normalized += "=";
  }

  const binaryString = atob(normalized);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convert Uint8Array to URL-safe base64 string.
 *
 * @param bytes - Byte array to encode
 * @returns URL-safe base64 string (replaces + with -, / with _, keeps = padding)
 */
function bytesToBase64UrlSafe(bytes: Uint8Array): string {
  // Convert to regular base64
  let base64 = "";
  const chunkSize = 0x8000; // 32KB chunks to avoid stack overflow
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    base64 += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  base64 = btoa(base64);
  
  // Make URL-safe: replace + with -, / with _
  // NOTE: Must keep base64 "=" padding suffix (required by CLOB API)
  return base64.replace(/\+/g, "-").replace(/\//g, "_");
}

/**
 * Build the message to be signed for L2 authentication.
 *
 * The message format is: timestamp + method + requestPath + body
 *
 * @param timestamp - Unix timestamp in seconds
 * @param method - HTTP method (GET, POST, DELETE, etc.)
 * @param requestPath - API endpoint path (e.g., "/order")
 * @param body - Optional request body (stringified JSON)
 * @returns Message string to be signed
 */
export function buildL2Message(
  timestamp: number,
  method: string,
  requestPath: string,
  body?: string
): string {
  return `${timestamp}${method.toUpperCase()}${requestPath}${body || ""}`;
}
