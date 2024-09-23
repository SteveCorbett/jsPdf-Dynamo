import { JsPdfProcessor } from "./models/jsPdfProcessor.js";
import { AppLogger, type ILogger } from "./models/logger.js";
import { getNextNumber, getNextString } from "./utils/utils.js";
import type { IJsPdfOptions } from "./models/jsPdfOptions.js";

export class JsPdfDynamo {
  #groups: { [key: string]: string[] } = {};
  _processor: JsPdfProcessor;
  #appLogger: ILogger;

  constructor(
    options: Partial<IJsPdfOptions> = {},
    logger: ILogger | null = null,
  ) {
    this.#appLogger = new AppLogger(logger);
    this._processor = this.prepareNewPdf(options, this.#appLogger);
  }

  public toBlob(): Blob | null {
    try {
      const result = this._processor.PdfDocument.output("blob");
      return result;
    } catch {
      this.#appLogger.warn(
        "Attempt to generate a blob from an empty PDF stream.",
      );
      return null;
    }
  }

  public toBlobUrl(): string | null {
    try {
      const result = this._processor.PdfDocument.output(
        "bloburi",
        "application/pdf",
      );
      return result;
    } catch {
      this.#appLogger.warn(
        "Attempt to generate a URL from an empty PDF stream.",
      );
      return null;
    }
  }

  public getVar(variableName: string): string | null {
    return this._processor
      ? (this._processor.getVar(variableName) ?? null)
      : null;
  }

  private prepareNewPdf(
    options: Partial<IJsPdfOptions>,
    logger: ILogger,
  ): JsPdfProcessor {
    return new JsPdfProcessor(options, logger);
  }

  public prepareWrappedString(input: string): string {
    if (!input) {
      return "";
    }
    return input
      .replace("%", "%%")
      .replace("\\", "\\\\")
      .replace(/\r?\n/g, "\\n");
  }

  public async processCommands(commands: string[]): Promise<void> {
    if (this._processor && commands && commands.length > 0) {
      await this.processTemplate(this._processor, commands);
    }
  }

  private async processTemplate(
    processor: JsPdfProcessor,
    input: string[],
  ): Promise<void> {
    let inGroupProcessing = false;
    let grpName = "";
    let currGroup: string[] = [];

    for (let ix = 0; ix < input.length; ix++) {
      let currLine = input[ix];
      if (!currLine || currLine.length === 0 || currLine.startsWith(";")) {
        continue;
      }

      if (currLine.startsWith("[")) {
        if (inGroupProcessing) {
          inGroupProcessing = false;
          this.#appLogger.debug(
            `Finished loading group ${grpName}   (${currLine})\n`,
          );
        } else {
          if (currLine.length === 1) continue;

          grpName = currLine.substring(1);
          const iy = grpName.indexOf("]");
          if (iy >= 0) {
            grpName = grpName.substring(0, iy);
          }
          grpName = grpName.trim().toLocaleUpperCase();
          inGroupProcessing = true;
          this.#appLogger.debug(`Loading group ${grpName}   (${currLine})\n`);
          currGroup = [];
          this.#groups[grpName] = currGroup;
        }
        continue;
      }

      if (inGroupProcessing) {
        currGroup.push(currLine);
        this.#appLogger.trace(`  ${currLine}`);
        continue;
      }

      if (
        currLine.length > 5 &&
        currLine.substring(0, 6).toLocaleLowerCase() === ".dump "
      ) {
        continue;
      }

      if (currLine.startsWith(".")) {
        await this.processDot(processor, currLine);
        continue;
      }
    }
  }

  public async processDot(
    processor: JsPdfProcessor,
    currLine: string,
  ): Promise<void> {
    const input = currLine.substring(1);
    let { first, rest: parameters } = getNextString(input);
    first = first.toLowerCase();

    switch (first) {
      case "AddBookmark".toLowerCase():
        processor.addBookmark(parameters);
        return;
      case "AddImageFromFile".toLowerCase():
        processor.addImageFromFile(parameters);
        return;
      case "AddImageFromUrl".toLowerCase():
        await processor.addImageFromUrl(parameters);
        return;
      case "AddPage".toLowerCase():
        processor.addPage(parameters);
        return;
      case "CheckPage".toLowerCase():
        await processor.checkPage(this, parameters);
        return;
      case "CopyVar".toLowerCase():
        processor.copyVar(parameters);
        return;
      case "Do".toLowerCase():
        await this.processGroups(processor, parameters);
        return;
      case "DoRepeat".toLowerCase():
        await this.processGroupsRepeat(processor, parameters);
        return;
      case "DrawBox".toLowerCase():
        processor.drawBox(parameters);
        return;
      case "DrawDebugGrid".toLowerCase():
        processor.drawDebugGrid(parameters);
        return;
      case "DrawImage".toLowerCase():
        processor.drawImage(parameters);
        return;
      case "DrawLine".toLowerCase():
        processor.drawLine(parameters);
        return;
      case "DrawText".toLowerCase():
        processor.drawText(parameters);
        return;
      case "DrawTextBox".toLowerCase():
        processor.drawTextBox(parameters);
        return;
      case "DrawTextWrapped".toLowerCase():
        await processor.drawTextWrapped(this, parameters);
        return;
      case "ForEachPage".toLowerCase():
        await processor.forEachPage(this, parameters);
        return;
      case "IfEq".toLowerCase():
        await processor.ifEq(this, parameters);
        return;
      case "IfBlank".toLowerCase():
        await processor.ifBlank(this, parameters);
        return;
      case "IfGt".toLowerCase():
        await processor.ifGt(this, parameters);
        return;
      case "IfNe".toLowerCase():
        await processor.ifNe(this, parameters);
        return;
      case "IfNotBlank".toLowerCase():
        await processor.ifNotBlank(this, parameters);
        return;
      case "incCurrentY".toLowerCase():
        processor.incCurrentY(parameters);
        return;
      case "incCurrentX".toLowerCase():
        processor.incCurrentX(parameters);
        return;
      case "Include".toLowerCase():
        await this.includeFile(processor, parameters);
        return;
      case "IncludeUri".toLowerCase():
        await this.includeUri(processor, parameters);
        return;
      case "IncVar".toLowerCase():
        processor.incVar(parameters);
        return;
      case "MultVar".toLowerCase():
        processor.multVar(parameters);
        return;
      case "SavePdf".toLowerCase():
        processor.savePdf(parameters);
        return;
      case "SelectPage".toLowerCase():
        processor.selectPage(parameters);
        return;
      case "setCurrentX".toLowerCase():
        processor.setCurrentX(parameters);
        return;
      case "setCurrentY".toLowerCase():
        processor.setCurrentY(parameters);
        return;
      case "SetDocumentInfo".toLowerCase():
        processor.setDocumentInfo(parameters);
        return;
      case "SetFillColor".toLowerCase():
      case "SetFillColour".toLowerCase():
        processor.setFillColour(parameters);
        return;
      case "SetFontName".toLowerCase():
        processor.setFontName(parameters);
        return;
      case "SetFontSize".toLowerCase():
        processor.setFontSize(parameters);
        return;
      case "SetFontStyle".toLowerCase():
        processor.setFontStyle(parameters);
        return;
      case "SetLineColor".toLowerCase():
      case "SetLineColour".toLowerCase():
        processor.setLineColour(parameters);
        return;
      case "SetLineWidth".toLowerCase():
        processor.setLineWidth(parameters);
        return;
      case "SetLogLevel".toLowerCase():
        processor.setLogLevel(parameters);
        return;
      case "SetMargin".toLowerCase():
        processor.setMargin(parameters);
        return;
      case "SetSpaceHoz".toLowerCase():
        processor.setSpaceHoz(parameters);
        return;
      case "SetSpaceVert".toLowerCase():
        processor.setSpaceVert(parameters);
        return;
      case "SetTextColour".toLowerCase():
      case "SetTextColor".toLowerCase():
        processor.setTextColour(parameters);
        return;
      case "SetVar".toLowerCase():
        processor.setVar(parameters);
        return;
      case "WriteLog".toLowerCase():
        processor.writeLog(parameters);
        return;
      default:
        this.#appLogger.error(`Unknown command: ${input}`);
    }
  }
  public async processGroups(
    processor: JsPdfProcessor,
    input: string,
    log: boolean = true,
  ): Promise<void> {
    let subs = processor.substitute(input.toLocaleUpperCase());
    if (log) {
      this.#appLogger.debug(`.Do ${subs}`);
    }
    processor.lastResult = "0";

    while (subs.length > 0) {
      let { first: group, rest } = getNextString(subs);
      subs = rest;
      this.#appLogger.debug(`\n[${group}]`);
      if (this.#groups[group]) {
        await this.processTemplate(processor, this.#groups[group]);
      } else {
        this.#appLogger.warn(`Group ${group} was not found.`);
        processor.lastResult = "0";
      }
    }
  }

  private async processGroupsRepeat(
    processor: JsPdfProcessor,
    input: string,
    log: boolean = true,
  ): Promise<void> {
    let subs = processor.substitute(input).toUpperCase();
    if (log) {
      this.#appLogger.debug(`.DoRepeat ${subs}`);
    }
    processor.lastResult = "0";

    let { first: count, rest } = getNextNumber(subs);

    while (count > 0) {
      count--;
      let groups = rest;
      while (groups.length > 0) {
        let { first: group, rest: remainder } = getNextString(groups);
        groups = remainder;
        this.#appLogger.debug(`\n[${group}]`);
        if (this.#groups[group]) {
          await this.processTemplate(processor, this.#groups[group]);
        } else {
          this.#appLogger.warn(`Group ${group} was not found.`);
          processor.lastResult = "0";
        }
      }
    }
  }

  private async includeFile(
    processor: JsPdfProcessor,
    input: string,
  ): Promise<void> {
    const subs = processor.substitute(input);
    this.#appLogger.debug(`.include ${subs}`);

    try {
      const fs = require("fs");
      let incArray = fs.readFileSync(subs).toString().split("\n") as string[];
      let incList = incArray.map((line) => line.trim());
      await this.processTemplate(processor, incList);
      this.#appLogger.debug(`${incList.length} lines included from ${subs}`);
      processor.lastResult = "1";
    } catch (ex: unknown) {
      let message = "";
      if (ex instanceof Error && ex.message) {
        message = `: ${ex.message}`;
      }
      this.#appLogger.error(`Unable to load or process file ${subs}${message}`);
      processor.lastResult = "0";
    }
  }

  private async includeUri(
    processor: JsPdfProcessor,
    input: string,
  ): Promise<void> {
    const subs = processor.substitute(input);
    this.#appLogger.debug(`.includeUri ${subs}`);

    try {
      const response = await fetch(subs, {
        headers: { Accept: "text/plain;q=0.9, text/*;q=0.8, */*;q=0.7" },
      });
      if (!response.ok) {
        throw new Error(`HTTP status ${response.status}.`);
      }
      const body = await response.text();
      let incArray = body.split("\n") as string[];
      let incList = incArray.map((line) => line.trim());
      await this.processTemplate(processor, incList);
      this.#appLogger.debug(`${incList.length} lines included from ${subs}`);
      processor.lastResult = "1";
    } catch (ex: unknown) {
      let message = "";
      if (ex instanceof Error && ex.message) {
        message = `: ${ex.message}`;
      }
      this.#appLogger.error(`Unable to load or process URI ${subs}${message}`);
      processor.lastResult = "0";
    }
  }
}
