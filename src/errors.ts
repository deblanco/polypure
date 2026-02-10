/**
 * Custom error classes for Polypure SDK.
 *
 * All SDK errors extend PolymarketError, which carries an optional
 * machine-readable code and HTTP status for structured error handling.
 */

/** Base error class for all Polypure SDK errors. */
export class PolymarketError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "PolymarketError";
  }
}

/** Thrown when API authentication fails (HTTP 401). */
export class AuthenticationError extends PolymarketError {
  constructor(message = "Authentication failed") {
    super(message, "AUTH_ERROR", 401);
    this.name = "AuthenticationError";
  }
}

/** Thrown when request parameters are invalid (HTTP 400). */
export class ValidationError extends PolymarketError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "ValidationError";
  }
}
