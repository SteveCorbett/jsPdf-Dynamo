import { expect, it, describe, beforeEach } from "vitest";
import { AppLogger } from "./logger.js";

describe("logger", () => {
  let logger: AppLogger;

  describe("logLevel", () => {
    beforeEach(() => {
      logger = new AppLogger();
    });

    it("should have a default log level of 2", () => {
      expect(logger["_logLevel"]).toBe(2);
    });

    it("should set log level to trace", () => {
      logger.logLevel("trace");
      expect(logger["_logLevel"]).toBe(0);
    });

    it("should set log level to debug", () => {
      logger.logLevel("debug");
      expect(logger["_logLevel"]).toBe(1);
    });

    it("should set log level to info", () => {
      logger.logLevel("info");
      expect(logger["_logLevel"]).toBe(2);
    });

    it("should set log level to warn", () => {
      logger.logLevel("warn");
      expect(logger["_logLevel"]).toBe(3);
    });

    it("should set log level to error", () => {
      logger.logLevel("error");
      expect(logger["_logLevel"]).toBe(4);
    });

    it("should set log level to silent", () => {
      logger.logLevel("silent");
      expect(logger["_logLevel"]).toBe(5);
    });

    it("should set log level to 0", () => {
      logger.logLevel(0);
      expect(logger["_logLevel"]).toBe(0);
    });

    it("should set log level to 1", () => {
      logger.logLevel(1);
      expect(logger["_logLevel"]).toBe(1);
    });

    it("should set log level to 2", () => {
      logger.logLevel(2);
      expect(logger["_logLevel"]).toBe(2);
    });

    it("should set log level to 3", () => {
      logger.logLevel(3);
      expect(logger["_logLevel"]).toBe(3);
    });

    it("should set log level to 4", () => {
      logger.logLevel(4);
      expect(logger["_logLevel"]).toBe(4);
    });

    it("should set log level to 5", () => {
      logger.logLevel(5);
      expect(logger["_logLevel"]).toBe(5);
    });

    it("should not set log level to 6", () => {
      logger.logLevel(6);
      expect(logger["_logLevel"]).toBe(2);
    });
  });
});
