import { expect, it, describe } from "vitest";
import { JsPdfDynamo } from "../src/jsPdfDynamo";
import { Logger } from "tslog";
import { ILogger } from "../src/models/logger";

describe("Build the documentation", () => {
  it("should build", async () => {
    const logger: ILogger = new Logger({
      name: "jspdf-dynamo",
      minLevel: 0,
      type: "pretty",
    });
    const pdfDynamo = new JsPdfDynamo(
      { pageSize: "a4", orientation: "portrait" },
      logger,
    );
    await pdfDynamo.processCommands([
      ".include ./documentation/documentation.txt",
    ]);
    expect(true).toBe(true);
  });
});
