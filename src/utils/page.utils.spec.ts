import { expect, it, describe } from "vitest";
import { isValidPageSize } from "./page.utils.js";

describe("page.utils", () => {
  describe("isValidPageSize", () => {
    it("should return true for valid page size", () => {
      expect(isValidPageSize("a4")).toBe(true);
      expect(isValidPageSize("legal")).toBe(true);
      expect(isValidPageSize("dl")).toBe(true);
    });

    it("should return false for invalid page size", () => {
      expect(isValidPageSize("z0")).toBe(false);
      expect(isValidPageSize("quarto")).toBe(false);
    });
  });
});
