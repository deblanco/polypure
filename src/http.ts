/**
 * Lightweight HTTP helper for Polypure SDK.
 *
 * Wraps the native `fetch` API with JSON serialization and error handling.
 * Used internally by the client and Gamma modules.
 */

import { PolymarketError } from "./errors.js";
import type { RequestOptions } from "./types/client.js";

/**
 * Perform an HTTP request and return the parsed JSON body.
 *
 * Automatically sets `Content-Type: application/json`, serializes the
 * body if present, and throws a `PolymarketError` on non-2xx responses.
 *
 * @param url - Fully qualified URL to request.
 * @param options - Optional method, body, and extra headers.
 * @returns Parsed JSON response typed as `T`.
 */
export async function httpRequest<T>(
  url: string,
  options: RequestOptions = {}
): Promise<T> {
  const method = options.method || "GET";

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    const error = `HTTP ${response.status}: ${text}`;
    throw new PolymarketError(error, "HTTP_ERROR", response.status);
  }

  return (await response.json()) as Promise<T>;
}
