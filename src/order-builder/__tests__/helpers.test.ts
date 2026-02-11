/**
 * Unit tests for order building helpers.
 */

import { describe, it, expect } from "bun:test";
import {
  roundDown,
  roundNormal,
  calculateBuyAmounts,
  calculateSellAmounts,
  calculateMarketBuyAmounts,
  alignPrice,
  generateSalt,
} from "../helpers.js";

describe("roundDown", () => {
  it("should round down to specified decimals", () => {
    expect(roundDown(1.2345, 2)).toBe(1.23);
    expect(roundDown(1.999, 2)).toBe(1.99);
    expect(roundDown(0.00123, 3)).toBe(0.001);
  });

  it("should handle zero", () => {
    expect(roundDown(0, 2)).toBe(0);
  });

  it("should handle integers", () => {
    expect(roundDown(100, 2)).toBe(100);
  });

  it("should handle exact decimals", () => {
    expect(roundDown(1.23, 2)).toBe(1.23);
  });
});

describe("roundNormal", () => {
  it("should round normally to specified decimals", () => {
    expect(roundNormal(1.2345, 2)).toBe(1.23);
    expect(roundNormal(1.235, 2)).toBe(1.24);
    expect(roundNormal(1.999, 2)).toBe(2.0);
  });

  it("should handle zero", () => {
    expect(roundNormal(0, 2)).toBe(0);
  });

  it("should handle integers", () => {
    expect(roundNormal(100, 2)).toBe(100);
  });
});

describe("calculateBuyAmounts", () => {
  it("should calculate BUY amounts correctly for 0.01 tick size", () => {
    const result = calculateBuyAmounts(100, 0.65, "0.01");

    // makerAmount = 100 * 0.65 = 65 USDC
    // takerAmount = 100 YES tokens
    expect(result.rawMakerAmt).toBe("65000000"); // 65 * 1e6
    expect(result.rawTakerAmt).toBe("100000000"); // 100 * 1e6
  });

  it("should calculate BUY amounts correctly for 0.1 tick size", () => {
    const result = calculateBuyAmounts(100, 0.65, "0.1");

    // With 0.1 tick size, price is rounded down to 0.6
    // makerAmount = 100 * 0.6 = 60 USDC
    expect(result.rawMakerAmt).toBe("60000000"); // 60 * 1e6
    expect(result.rawTakerAmt).toBe("100000000"); // 100 * 1e6
  });

  it("should handle small sizes", () => {
    const result = calculateBuyAmounts(1, 0.5, "0.01");

    expect(result.rawMakerAmt).toBe("500000"); // 0.5 * 1e6
    expect(result.rawTakerAmt).toBe("1000000"); // 1 * 1e6
  });
});

describe("calculateSellAmounts", () => {
  it("should calculate SELL amounts correctly for 0.01 tick size", () => {
    const result = calculateSellAmounts(100, 0.65, "0.01");

    // makerAmount = 100 YES tokens
    // takerAmount = 100 * 0.65 = 65 USDC
    expect(result.rawMakerAmt).toBe("100000000"); // 100 * 1e6
    expect(result.rawTakerAmt).toBe("65000000"); // 65 * 1e6
  });

  it("should calculate SELL amounts correctly for 0.1 tick size", () => {
    const result = calculateSellAmounts(100, 0.65, "0.1");

    // With 0.1 tick size, price is rounded down to 0.6
    // takerAmount = 100 * 0.6 = 60 USDC
    expect(result.rawMakerAmt).toBe("100000000"); // 100 * 1e6
    expect(result.rawTakerAmt).toBe("60000000"); // 60 * 1e6
  });
});

describe("calculateMarketBuyAmounts", () => {
  it("should calculate MARKET BUY amounts correctly", () => {
    const result = calculateMarketBuyAmounts(100, 0.5, "0.01");

    // Spending 100 USDC at price 0.5
    // makerAmount = 100 USDC
    // takerAmount = 100 / 0.5 = 200 YES tokens
    expect(result.rawMakerAmt).toBe("100000000"); // 100 * 1e6
    expect(result.rawTakerAmt).toBe("200000000"); // 200 * 1e6
  });

  it("should handle zero price", () => {
    const result = calculateMarketBuyAmounts(100, 0, "0.01");

    expect(result.rawMakerAmt).toBe("100000000");
    expect(result.rawTakerAmt).toBe("0");
  });
});

describe("alignPrice", () => {
  it("should align price to 0.01 tick size", () => {
    expect(alignPrice(0.657, "0.01")).toBe(0.65);
    expect(alignPrice(0.999, "0.01")).toBe(0.99);
    expect(alignPrice(0.001, "0.01")).toBe(0);
  });

  it("should align price to 0.1 tick size", () => {
    expect(alignPrice(0.657, "0.1")).toBe(0.6);
    expect(alignPrice(0.999, "0.1")).toBe(0.9);
    expect(alignPrice(0.5, "0.1")).toBe(0.5);
  });

  it("should align price to 0.001 tick size", () => {
    expect(alignPrice(0.1234, "0.001")).toBe(0.123);
    expect(alignPrice(0.9999, "0.001")).toBe(0.999);
  });
});

describe("generateSalt", () => {
  it("should generate a valid salt", () => {
    const salt = generateSalt();

    expect(salt).toBeDefined();
    expect(typeof salt).toBe("string");
    expect(salt.length).toBeGreaterThan(0);

    // Should be a valid BigInt
    const bigIntSalt = BigInt(salt);
    expect(bigIntSalt).toBeGreaterThan(BigInt(0));
  });

  it("should generate unique salts", () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();

    expect(salt1).not.toBe(salt2);
  });
});
