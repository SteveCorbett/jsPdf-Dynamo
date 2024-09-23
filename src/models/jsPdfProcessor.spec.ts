import { expect, it, describe, beforeEach } from "vitest";
import { JsPdfProcessor } from "./jsPdfProcessor";
import { Logger, ILogObj } from "tslog";
import { JsPdfDynamo } from "../jsPdfDynamo";

describe("jsPdfProcessor", () => {
  let dynamo: JsPdfDynamo;
  let processor: JsPdfProcessor;
  let logger: Logger<ILogObj>;

  describe("commands", () => {
    beforeEach(() => {
      logger = new Logger({ name: "jsPdfProcessor.spec" });
      dynamo = new JsPdfDynamo(
        { pageSize: "a4", orientation: "portrait" },
        logger,
      );
      processor = dynamo["_processor"];
    });

    describe("drawBox", () => {
      it("should draw a box", () => {
        processor.addPage("A4");
        processor.drawBox("0 0 100.5 200");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_lastObjectWidth")).toBe("100.50");
        expect(processor.getVar("_lastObjectHeight")).toBe("200.00");
      });
    });

    describe("ifEq", () => {
      it("should run the commands if the variables are equal numbers", async () => {
        processor.setVar("var2 10.2");
        processor.setVar("var3 X");
        await processor.ifEq(dynamo, "10.2 %var2% .setVar var3 20");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("var3")).toBe("20");
      });
      it("should run the commands if the variables are equal strings", async () => {
        processor.setVar("var1 abc");
        processor.setVar("var3 X");
        await processor.ifEq(dynamo, "%var1% abc .setVar var3 20");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("var3")).toBe("20");
      });
      it("should run the commands if the equal string variables contain spaces", async () => {
        processor.setVar("var1 abc def");
        processor.setVar("var2 abc def");
        processor.setVar("var3 X");
        await processor.ifEq(dynamo, "%var1% %var2% .setVar var3 20");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("var3")).toBe("20");
      });
      it("should not run the commands if the variables are not equal numbers", async () => {
        processor.setVar("var1 10.2");
        processor.setVar("var3 X");
        await processor.ifEq(dynamo, "%var1% 5 .setVar var3 20");
        expect(processor.getVar("_lastResult")).toBe("0");
        expect(processor.getVar("var3")).toBe("X");
      });
      it("should not run the commands if the variables are not equal strings", async () => {
        processor.setVar("var2 def");
        processor.setVar("var3 X");
        await processor.ifEq(dynamo, "Abc %var2% .setVar var3 20");
        expect(processor.getVar("_lastResult")).toBe("0");
        expect(processor.getVar("var3")).toBe("X");
      });
    });

    describe("ifNe", () => {
      it("should not run the commands if the variables are equal numbers", async () => {
        processor.setVar("var1 10.2");
        processor.setVar("var2 10.2");
        processor.setVar("var3 X");
        await processor.ifNe(dynamo, "%var1% %var2% .setVar var3 20");
        expect(processor.getVar("_lastResult")).toBe("0");
        expect(processor.getVar("var3")).toBe("X");
      });
      it("should not run the commands if the variables are equal strings", async () => {
        processor.setVar("var1 abc 123");
        processor.setVar("var2 abc 123");
        processor.setVar("var3 X");
        await processor.ifNe(dynamo, "%var1% %var2% .setVar var3 20");
        expect(processor.getVar("_lastResult")).toBe("0");
        expect(processor.getVar("var3")).toBe("X");
      });
      it("should run the commands if the variables are not equal numbers", async () => {
        processor.setVar("var1 10.2");
        processor.setVar("var3 X");
        await processor.ifNe(dynamo, "%var1% 123 .setVar var3 20");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("var3")).toBe("20");
      });
      it("should run the commands if the variables are not equal strings", async () => {
        processor.setVar("var2 def 123");
        processor.setVar("var3 X");
        await processor.ifNe(dynamo, "XyZ %var2% .setVar var3 20");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("var3")).toBe("20");
      });
    });

    describe("ifGt", () => {
      it("should not run the commands if the variables are equal numbers", async () => {
        processor.setVar("var1 10.2");
        processor.setVar("var2 10.2");
        processor.setVar("var3 X");
        await processor.ifGt(dynamo, "%var1% %var2% .setVar var3 20");
        expect(processor.getVar("_lastResult")).toBe("0");
        expect(processor.getVar("var3")).toBe("X");
      });
      it("should not run the commands if the variables are equal strings", async () => {
        processor.setVar("var1 abc 123");
        processor.setVar("var2 abc 123");
        processor.setVar("var3 X");
        await processor.ifGt(dynamo, "%var1% %var2% .setVar var3 20");
        expect(processor.getVar("_lastResult")).toBe("0");
        expect(processor.getVar("var3")).toBe("X");
      });
      it("should run the commands if both variables are numbers and the first is greater than the second", async () => {
        processor.setVar("var1 10.2");
        processor.setVar("var3 X");
        await processor.ifGt(dynamo, "%var1% -123 .setVar var3 20");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("var3")).toBe("20");
      });
      it("should not run the commands if both variables are numbers and the first is greater than the second", async () => {
        processor.setVar("var1 10.2");
        processor.setVar("var3 X");
        await processor.ifGt(dynamo, "-123 %var1% .setVar var3 20");
        expect(processor.getVar("_lastResult")).toBe("0");
        expect(processor.getVar("var3")).toBe("X");
      });
      it("should run the commands if at least one of the variables is a string and the first is greater than the second", async () => {
        processor.setVar("var2 Def 123");
        processor.setVar("var3 X");
        await processor.ifGt(dynamo, "XyZ %var2% .setVar var3 20");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("var3")).toBe("20");
      });
    });

    describe("incCurrentX", () => {
      it("should increment the current left (y) position", () => {
        processor.addPage("A4");
        processor.setCurrentX("0");
        expect(processor.getVar("_CurrentX")).toBe("0.00");
        processor.incCurrentX("10");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_CurrentX")).toBe("10.00");
      });
      it("should decrement the current left (y) position given a negative number", () => {
        processor.addPage("A4");
        processor.setCurrentX("10");
        processor.incCurrentX("-6");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_CurrentX")).toBe("4.00");
      });
      it("should increment the current left (y) position multiple times", () => {
        processor.addPage("A4");
        processor.setCurrentX("5");
        processor.incCurrentX("10 15");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_CurrentX")).toBe("30.00");
      });
      it("should handle empty input", () => {
        processor.addPage("A4");
        processor.setCurrentX("5");
        processor.incCurrentX("");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_CurrentX")).toBe("5.00");
      });
      it("should ignore non-numeric input", () => {
        processor.addPage("A4");
        processor.setCurrentX("5");
        processor.incCurrentX("abc& 10");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_CurrentX")).toBe("15.00");
      });
    });

    describe("incCurrentY", () => {
      it("should increment the current top (y) position", () => {
        processor.addPage("A4");
        processor.setCurrentY("0");
        expect(processor.getVar("_CurrentY")).toBe("0.00");
        processor.incCurrentY("10.3");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_CurrentY")).toBe("10.30");
      });
      it("should decrement the current top (y) position given a negative number", () => {
        processor.addPage("A4");
        processor.setCurrentY("9");
        processor.incCurrentY("-6");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_CurrentY")).toBe("3.00");
      });
      it("should increment the current top (y) position multiple times", () => {
        processor.addPage("A4");
        processor.setCurrentY("5");
        processor.incCurrentY("10 15");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_CurrentY")).toBe("30.00");
      });
      it("should handle empty input", () => {
        processor.addPage("A4");
        processor.setCurrentY("1.2");
        processor.incCurrentY("");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_CurrentY")).toBe("1.20");
      });
      it("should ignore non-numeric input", () => {
        processor.addPage("A4");
        processor.setCurrentY("5");
        processor.incCurrentY("abc& 10");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_CurrentY")).toBe("15.00");
      });
    });

    describe("incVar", () => {
      it("should increment a variable with no decimal positions", () => {
        processor.setVar("var1 115");
        processor.incVar("var1 1.2");
        expect(processor.getVar("var1")).toBe("116.2");
        expect(processor.getVar("_lastResult")).toBe("1");
      });
      it("should increment a variable with decimal positions", () => {
        processor.setVar("var1 5.7");
        processor.incVar("var1 10.2");
        expect(processor.getVar("var1")).toBe("15.9");
        expect(processor.getVar("_lastResult")).toBe("1");
      });
      it("should handle empty input", () => {
        processor.setVar("var1 5");
        processor.incVar("");
        expect(processor.getVar("var1")).toBe("5");
        expect(processor.getVar("_lastResult")).toBe("1");
      });
      it("should ignore non-numeric input", () => {
        processor.setVar("var1 5");
        processor.incVar("var1 abc& 10");
        expect(processor.getVar("var1")).toBe("15");
        expect(processor.getVar("_lastResult")).toBe("1");
      });
      it("should return an error when the variable is not set", () => {
        processor.incVar("var1 10");
        expect(processor.getVar("_lastResult")).toBe("0");
      });
      it("should handle substitution variables", () => {
        processor.setVar("var1 5");
        processor.setVar("var2 10");
        processor.incVar("var1 %var2%");
        expect(processor.getVar("var1")).toBe("15");
        expect(processor.getVar("_lastResult")).toBe("1");
      });
    });

    describe("multVar", () => {
      it("should multiply a variable with no decimal positions", () => {
        processor.setVar("var1 120");
        processor.multVar("var1 2");
        expect(processor.getVar("var1")).toBe("240");
        expect(processor.getVar("_lastResult")).toBe("1");
      });
      it("should multiply a variable with decimal positions", () => {
        processor.setVar("var1 5.7");
        processor.multVar("var1 10.2");
        expect(processor.getVar("var1")).toBe("58.14");
        expect(processor.getVar("_lastResult")).toBe("1");
      });
      it("should multiply a variable with values less than one", () => {
        processor.setVar("var1 50");
        processor.multVar("var1 0.2");
        expect(processor.getVar("var1")).toBe("10");
        expect(processor.getVar("_lastResult")).toBe("1");
      });
      it("should handle empty input", () => {
        processor.setVar("var1 5");
        processor.multVar("");
        expect(processor.getVar("var1")).toBe("5");
        expect(processor.getVar("_lastResult")).toBe("1");
      });
      it("should ignore non-numeric input", () => {
        processor.setVar("var1 5");
        processor.multVar("var1 abc& 10");
        expect(processor.getVar("var1")).toBe("50");
        expect(processor.getVar("_lastResult")).toBe("1");
      });
      it("should return an error when the variable is not set", () => {
        processor.multVar("var1 10");
        expect(processor.getVar("_lastResult")).toBe("0");
      });
      it("should handle substitution variables", () => {
        processor.setVar("var1 5");
        processor.setVar("var2 10");
        processor.multVar("var1 %var2%");
        expect(processor.getVar("var1")).toBe("50");
        expect(processor.getVar("_lastResult")).toBe("1");
      });
      it("should handle multiple multipliers", () => {
        processor.setVar("var1 5");
        processor.multVar("var1 2 3");
        expect(processor.getVar("var1")).toBe("30");
        expect(processor.getVar("_lastResult")).toBe("1");
      });
    });

    describe("setCurrentX", () => {
      it("should set the current left position", () => {
        processor.setCurrentX("10");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_CurrentX")).toBe("10.00");
      });
    });

    describe("setCurrentY", () => {
      it("should set the current top position", () => {
        processor.setCurrentY("12.23");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_CurrentY")).toBe("12.23");
      });
    });

    describe("setFillColour", () => {
      it("should set the fill colour", () => {
        processor.setFillColour("red");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_FillColour")).toBe("red");
      });
      it("should set the fill colour in lower case", () => {
        processor.setFillColour("BLUE");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_FillColour")).toBe("blue");
      });
    });

    describe("setLineColour", () => {
      it("should set the line colour", () => {
        processor.setLineColour("purple");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_LineColour")).toBe("purple");
      });
      it("should set the line colour in lower case", () => {
        processor.setLineColour("#20AcFf");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_LineColour")).toBe("#20acff");
      });
    });

    describe("setMargin", () => {
      it("should set the margins", () => {
        expect(processor.getVar("_MarginLeft")).toBe("10.5833");
        expect(processor.getVar("_MarginRight")).toBe("10.5833");
        expect(processor.getVar("_MarginTop")).toBe("10.5833");
        expect(processor.getVar("_MarginBottom")).toBe("10.5833");

        processor.setMargin("l 15");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_MarginLeft")).toBe("15");
        expect(processor.getVar("_MarginRight")).toBe("10.5833");
        expect(processor.getVar("_MarginTop")).toBe("10.5833");
        expect(processor.getVar("_MarginBottom")).toBe("10.5833");

        processor.setMargin("r 16.5");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_MarginLeft")).toBe("15");
        expect(processor.getVar("_MarginRight")).toBe("16.5");
        expect(processor.getVar("_MarginTop")).toBe("10.5833");
        expect(processor.getVar("_MarginBottom")).toBe("10.5833");

        processor.setMargin("t 12.25");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_MarginLeft")).toBe("15");
        expect(processor.getVar("_MarginRight")).toBe("16.5");
        expect(processor.getVar("_MarginTop")).toBe("12.25");
        expect(processor.getVar("_MarginBottom")).toBe("10.5833");
        expect(processor.getVar("_MarginBottom")).toBe("10.5833");

        processor.setMargin("b 0");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_MarginLeft")).toBe("15");
        expect(processor.getVar("_MarginRight")).toBe("16.5");
        expect(processor.getVar("_MarginTop")).toBe("12.25");
        expect(processor.getVar("_MarginBottom")).toBe("0");

        processor.setMargin("a 15");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_MarginLeft")).toBe("15");
        expect(processor.getVar("_MarginRight")).toBe("15");
        expect(processor.getVar("_MarginTop")).toBe("15");
        expect(processor.getVar("_MarginBottom")).toBe("15");

        processor.setMargin("h 10");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_MarginLeft")).toBe("10");
        expect(processor.getVar("_MarginRight")).toBe("10");
        expect(processor.getVar("_MarginTop")).toBe("15");
        expect(processor.getVar("_MarginBottom")).toBe("15");
        expect(processor.getVar("_MarginBottom")).toBe("15");

        processor.setMargin("v 12");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_MarginLeft")).toBe("10");
        expect(processor.getVar("_MarginRight")).toBe("10");
        expect(processor.getVar("_MarginTop")).toBe("12");
        expect(processor.getVar("_MarginBottom")).toBe("12");
      });
    });

    describe("setSpaceHoz", () => {
      it("should set the horizontal spacing value", () => {
        processor.setSpaceHoz("10");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_SpaceHoz")).toBe("10.00");
      });
    });

    describe("setSpaceVert", () => {
      it("should set the vertical spacing value", () => {
        processor.setSpaceVert("12.23");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_SpaceVert")).toBe("12.230");
      });
    });

    describe("setTextColour", () => {
      it("should set the current text colour", () => {
        processor.setTextColour("green");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_TextColour")).toBe("green");
      });
      it("should set the current text colour in lower case", () => {
        processor.setTextColour("bLaCK");
        expect(processor.getVar("_lastResult")).toBe("1");
        expect(processor.getVar("_TextColour")).toBe("black");
      });
    });

    describe("setVar/getVar", () => {
      it("should set and get variables", () => {
        processor.setVar("var1 value1");
        expect(processor.getVar("var1")).toBe("value1");
        expect(processor.getVar("_lastResult")).toBe("1");
      });
      it("should return an empty string for unset variables", () => {
        expect(processor.getVar("var2")).toBe("");
        expect(processor.getVar("_lastResult")).toBe("0");
      });
      it("should return an error when a variable is not given", () => {
        processor.setVar("");
        expect(processor.getVar("_lastResult")).toBe("0");
      });
      it("should return an error when attempting to update system variables", () => {
        processor.setVar("_var1 value1");
        expect(processor.getVar("_lastResult")).toBe("0");
      });
    });
  });

  // describe("utility functions", () => {
  //     describe("getNextWrappedLine", () => {
  //         it("should return the next wrapped line", () => {
  //             const input = "This is a test string.";
  //             const result = processor["getNextWrappedLine"](input, 45);
  //             expect(result.first, `Input "${input}" is ${processor["getTextWidth"](input)} pts wide`).toBe("This is a");
  //             expect(result.rest).toBe("test string.");
  //         });

  //         it("should return the next wrapped line with a new line", () => {
  //             const input = "This is\\n a test string.";
  //             const result = processor["getNextWrappedLine"](input, 35);
  //             expect(result.first, `Input "${input}" is ${processor["getTextWidth"](input)} pts wide`).toBe("This is");
  //             expect(result.rest).toBe("a test string.");
  //         });

  //         it("should return the entire line if it fits", () => {
  //             const input = "This is a test string.";
  //             const result = processor["getNextWrappedLine"](input, 140);
  //             expect(result.first).toBe("This is a test string.");
  //             expect(result.rest).toBe("");
  //         });

  //         it("should return leading blanks", () => {
  //             const input = "  This is a test string.";
  //             const result = processor["getNextWrappedLine"](input, 34);
  //             expect(result.first).toBe("  This");
  //             expect(result.rest).toBe("is a test string.");
  //         });

  //         it("should not break on the leading blanks", () => {
  //             const input = "  This-is-a-test-string.";
  //             const result = processor["getNextWrappedLine"](input, 34);
  //             expect(result.first).toBe("  This-");
  //             expect(result.rest).toBe("is-a-test-string.");
  //         });

  //         it("should handle a string starting with a new line", () => {
  //             const input = "\\nThis is a test string.";
  //             const result = processor["getNextWrappedLine"](input, 34);
  //             expect(result.first).toBe("");
  //             expect(result.rest).toBe("This is a test string.");
  //         });

  //         it("should handle a string starting with two new lines", () => {
  //             const input = "\\n\\nThis is a test string.";
  //             const result = processor["getNextWrappedLine"](input, 34);
  //             expect(result.first).toBe("");
  //             expect(result.rest).toBe("\\nThis is a test string.");
  //         });
  //     });
  // });
});
