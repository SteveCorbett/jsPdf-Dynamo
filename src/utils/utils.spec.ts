import {
  getNextNumber,
  getNextString,
  inchesToPixels,
  inchesToPoints,
  isBrowser,
  mmToPixels,
  mmToPoints,
  pointsToInches,
  pointsToMm,
  pointsToPixels,
  removeTrailingZeros,
} from "./utils.js";
import { it, expect, describe } from "vitest";

describe("utils.js", () => {
  describe("getNextNumber", () => {
    it("should return integers correctly", () => {
      let input = "  12 -23 two ";
      const { first, rest } = getNextNumber(input);
      expect(first).toBe(12);
      expect(rest).toBe("-23 two ");
    });

    it("should return doubles correctly when all ", () => {
      let input = "  1.23456 -23  two ";
      const { first, rest } = getNextNumber(input, 5);
      expect(first).toBe(1.23456);
      expect(rest).toBe("-23  two ");
    });

    it("should return doubles correctly", () => {
      let input = "  1.23456 -23  two ";
      const { first, rest } = getNextNumber(input, 5);
      expect(first).toBe(1.23456);
      expect(rest).toBe("-23  two ");
    });
    it("should return negative numbers correctly", () => {
      let input = "  -23456 two  -23 ";
      const { first, rest } = getNextNumber(input);
      expect(first).toBe(-23456);
      expect(rest).toBe("two  -23 ");
    });
    it("should return NaN for non-numeric input", () => {
      let input = "A@-23456 two  -23";
      const { first, rest } = getNextNumber(input);
      expect(first).toBe(NaN);
      expect(rest).toBe("two  -23");
    });
    it("should return 0 for blank input", () => {
      let input = "";
      const { first, rest } = getNextNumber(input);
      expect(first).toBe(0);
      expect(rest).toBe("");
    });
  });

  describe("getNextString", () => {
    it("should remove the first of three character strings", () => {
      let input = "  one  two  three ";
      const { first, rest } = getNextString(input);
      expect(first).toBe("one");
      expect(rest).toBe("two  three ");
    });
    it("should handle empty input", () => {
      let input = "";
      const { first, rest } = getNextString(input);
      expect(first).toBe("");
      expect(rest).toBe("");
    });
    it("should handle blanks only input", () => {
      let input = " ";
      const { first, rest } = getNextString(input);
      expect(first).toBe("");
      expect(rest).toBe("");
    });
  });

  describe("isBrowser", () => {
    it("should return false when running in node", () => {
      expect(isBrowser()).toBe(false);
    });
  });

  describe("pointsToMm", () => {
    it("should convert points to mm", () => {
      expect(pointsToMm(72)).toBe(25.4);
      expect(pointsToMm(144)).toBe(50.8);
      expect(pointsToMm(288)).toBe(101.6);
    });

    it("should return null for null input", () => {
      expect(pointsToMm(null)).toBe(null);
    });

    it("should return undefined for undefined input", () => {
      expect(pointsToMm(undefined)).toBe(undefined);
    });

    it("should return Nan for invalid input", () => {
      expect(pointsToMm(NaN)).toBe(NaN);
    });
  });

  describe("mmToPoints", () => {
    it("should convert mm to points", () => {
      expect(mmToPoints(0.1)).toBe(0.2835);
      expect(mmToPoints(10)).toBe(28.3465);
      expect(mmToPoints(25.4)).toBe(72);
      expect(mmToPoints(50.8)).toBe(144);
      expect(mmToPoints(101.6)).toBe(288);
    });
    it("should return null for null input", () => {
      expect(pointsToMm(null)).toBe(null);
    });

    it("should return undefined for undefined input", () => {
      expect(pointsToMm(undefined)).toBe(undefined);
    });

    it("should return Nan for invalid input", () => {
      expect(pointsToMm(NaN)).toBe(NaN);
    });
  });

  describe("pointsToInches", () => {
    it("should convert points to inches", () => {
      expect(pointsToInches(36)).toBe(0.5);
      expect(pointsToInches(72)).toBe(1);
      expect(pointsToInches(144)).toBe(2);
      expect(pointsToInches(288)).toBe(4);
    });

    it("should return null for null input", () => {
      expect(pointsToInches(null)).toBe(null);
    });

    it("should return undefined for undefined input", () => {
      expect(pointsToInches(undefined)).toBe(undefined);
    });

    it("should return Nan for invalid input", () => {
      expect(pointsToInches(NaN)).toBe(NaN);
    });
  });

  describe("inchesToPoints", () => {
    it("should convert mm to points", () => {
      expect(inchesToPoints(1)).toBe(72.0001);
      expect(inchesToPoints(2)).toBe(144.0003);
      expect(inchesToPoints(3)).toBe(216.0004);
    });
    it("should return null for null input", () => {
      expect(inchesToPoints(null)).toBe(null);
    });

    it("should return undefined for undefined input", () => {
      expect(inchesToPoints(undefined)).toBe(undefined);
    });

    it("should return Nan for invalid input", () => {
      expect(inchesToPoints(NaN)).toBe(NaN);
    });
  });

  describe("mmToPixels", () => {
    it("should convert mm to pixels", () => {
      expect(mmToPixels(1)).toBe(3.7795);
      expect(mmToPixels(10)).toBe(37.7953);
      expect(mmToPixels(25.4)).toBe(96);
      expect(mmToPixels(50.8)).toBe(192);
      expect(mmToPixels(101.6)).toBe(384);
    });
    it("should return null for null input", () => {
      expect(mmToPixels(null)).toBe(null);
    });

    it("should return undefined for undefined input", () => {
      expect(mmToPixels(undefined)).toBe(undefined);
    });

    it("should return Nan for invalid input", () => {
      expect(mmToPixels(NaN)).toBe(NaN);
    });
  });

  describe("inchesToPixels", () => {
    it("should convert inches to pixels", () => {
      expect(inchesToPixels(1)).toBe(96);
      expect(inchesToPixels(2)).toBe(192);
      expect(inchesToPixels(3)).toBe(288);
    });
    it("should return null for null input", () => {
      expect(inchesToPixels(null)).toBe(null);
    });

    it("should return undefined for undefined input", () => {
      expect(inchesToPixels(undefined)).toBe(undefined);
    });

    it("should return Nan for invalid input", () => {
      expect(inchesToPixels(NaN)).toBe(NaN);
    });
  });

  describe("pointsToPixels", () => {
    it("should convert points to pixels", () => {
      expect(pointsToPixels(1)).toBe(1.3333);
      expect(pointsToPixels(10)).toBe(13.3333);
      expect(pointsToPixels(25.4)).toBe(33.8667);
      expect(pointsToPixels(50.8)).toBe(67.7333);
      expect(pointsToPixels(101.6)).toBe(135.4667);
    });
    it("should return null for null input", () => {
      expect(pointsToPixels(null)).toBe(null);
    });

    it("should return undefined for undefined input", () => {
      expect(pointsToPixels(undefined)).toBe(undefined);
    });

    it("should return Nan for invalid input", () => {
      expect(pointsToPixels(NaN)).toBe(NaN);
    });
  });

  describe("removeTrailingZeros", () => {
    it("should remove trailing zeros when given a number with decimal positions", () => {
      expect(removeTrailingZeros("1.0000")).toBe("1");
      expect(removeTrailingZeros("1.1000")).toBe("1.1");
      expect(removeTrailingZeros("1.0100")).toBe("1.01");
      expect(removeTrailingZeros("1.0010")).toBe("1.001");
      expect(removeTrailingZeros("1.0001")).toBe("1.0001");
    });
    it("should remove trailing zeros when given a number without decimal positions", () => {
      expect(removeTrailingZeros("0")).toBe("0");
      expect(removeTrailingZeros("10000")).toBe("10000");
    });
    it("should return the input when given a non-numeric number", () => {
      expect(removeTrailingZeros("10.00.0")).toBe("10.00.0");
      expect(removeTrailingZeros("xyz")).toBe("xyz");
    });
    it("should return the input when given blanks only", () => {
      expect(removeTrailingZeros("")).toBe("");
      expect(removeTrailingZeros("  ")).toBe("  ");
    });
  });
});
