/**
 * Lightweight HTTP helper for Polypure SDK.
 *
 * Wraps the native `fetch` API with JSON serialization, error handling,
 * and structured logging. Used internally by the client and Gamma modules.
 */

import { log } from "./logger.js";
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

  log.debug("HTTP request", {
    url,
    method,
    hasBody: !!options.body,
  });

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
    log.error("HTTP request failed", {
      url,
      method,
      status: response.status,
      statusText: response.statusText,
      responseText: text,
    });
    throw new PolymarketError(error, "HTTP_ERROR", response.status);
  }

  const data = (await response.json()) as Promise<T>;

  log.debug("HTTP request succeeded", {
    url,
    method,
    status: response.status,
  });

  return data;
}
