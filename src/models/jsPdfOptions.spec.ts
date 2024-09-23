import { expect, it, describe, beforeEach } from "vitest";
import { JsPdfOptions } from "./jsPdfOptions";

describe("JsPdfOptions", () => {
  it("should create an instance with default values with an empty constructor", () => {
    const options = new JsPdfOptions();
    expect(options).toBeInstanceOf(JsPdfOptions);
    expect(options.pageSize).toBe("a4");
    expect(options.orientation).toBe("portrait");
    expect(options.unit).toBe("mm");
    expect(options.margins).toEqual({
      top: 10,
      bottom: 10,
      left: 10,
      right: 10,
    });
  });
  it("should create an instance with all values of the parameter are given", () => {
    const options = new JsPdfOptions({
      margins: { top: 1, bottom: 2, left: 3, right: 4 },
      pageSize: "a5",
      orientation: "landscape",
      unit: "in",
    });
    expect(options).toBeInstanceOf(JsPdfOptions);
    expect(options.pageSize).toBe("a5");
    expect(options.orientation).toBe("landscape");
    expect(options.unit).toBe("in");
    expect(options.margins).toEqual({ top: 1, bottom: 2, left: 3, right: 4 });
  });
  it("should create an instance with defaults when a partial parameter of values is given", () => {
    const options = new JsPdfOptions({
      margins: { bottom: 15 },
      orientation: "landscape",
    });
    expect(options).toBeInstanceOf(JsPdfOptions);
    expect(options.pageSize).toBe("a4");
    expect(options.orientation).toBe("landscape");
    expect(options.unit).toBe("mm");
    expect(options.margins).toEqual({
      top: 10,
      bottom: 15,
      left: 10,
      right: 10,
    });
  });
});
