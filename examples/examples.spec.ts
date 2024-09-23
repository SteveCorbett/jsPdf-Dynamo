import { expect, it, describe } from "vitest";
import { JsPdfDynamo } from "../src/jsPdfDynamo";

describe("app", () => {
  it("1. Simple", async () => {
    const pdfDynamo = new JsPdfDynamo({
      pageSize: "a4",
      orientation: "portrait",
      unit: "mm",
    });

    const commands = [
      // Load the template
      ".include ./examples/1.Simple/template.txt",
      // Set the title
      ".SetVar title This is a title",
      // Process the template
      ".Do DrawPage",
      // Save the pdf
      ".SavePdf ./examples/1.Simple/simple.pdf",
    ];

    await pdfDynamo.processCommands(commands);
    expect(true).toBe(true);
  });
});
