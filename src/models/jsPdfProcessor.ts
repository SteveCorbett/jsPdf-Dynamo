import jsPDF, { type OutlineItem } from "jspdf";
import * as fs from "fs";

import { AppLogger, type ILogger } from "./logger.js";
import {
  getNextNumber,
  getNextString,
  inchesToPoints,
  isBrowser,
  mmToPoints,
  pixelsToInches,
  pixelsToMm,
  pixelsToPoints,
  pointsToInches,
  pointsToMm,
  pointsToPixels,
  removeTrailingZeros,
} from "../utils/utils.js";
import { isValidPageSize, type pageSizeType } from "../utils/page.utils.js";
import {
  isValidFontStyle,
  uomEnum,
  type alignmentType,
  type fontStyleType,
  type orientationType,
  type uomType,
} from "../utils/types.js";
import type { JsPdfDynamo } from "../jsPdfDynamo.js";
import { JsPdfOptions, type IJsPdfOptions } from "./jsPdfOptions.js";

export class JsPdfProcessor {
  private _variables: Map<string, string> = new Map();
  private _bookmarks: OutlineItem[] = [];
  private _images: string[] = [];
  private _logger: AppLogger;

  private _pdfDocument: jsPDF;
  public get PdfDocument(): jsPDF {
    return this._pdfDocument;
  }

  private _currentPageNumber = 0;
  public get currentPageNumber(): number {
    return this._currentPageNumber;
  }
  public set currentPageNumber(value: number) {
    if (isNaN(value)) {
      this.lastResult = "0";
      this.lastError = "Page number must be a number, received 'NaN'";
      return;
    }
    if (value !== Math.floor(value)) {
      this.lastResult = "0";
      this.lastError = "Page number must be an integer";
      return;
    }
    if (value < 0) {
      this.lastResult = "0";
      this.lastError = "Page number must be greater than 0";
      return;
    }
    if (value > this.pageCount) {
      this.lastResult = "0";
      this.lastError = `Page number ${value} is greater than the number of pages`;
      return;
    }

    this._currentPageNumber = value;
    this._variables.set("_PAGENO", value.toString());
    this.calcPageDimensions(this._pdfDocument);
  }

  private _currentUom: uomType = "mm";
  public get currentUom(): uomType {
    return this._currentUom;
  }
  public set currentUom(value: uomType) {
    if (this._currentUom !== value) {
      this._currentUom = value;
      // Now update all variables to this new uom
    }
  }

  private _fillColour: string = "white";
  public get fillColour(): string {
    return this._fillColour;
  }
  private set fillColour(value: string) {
    this._fillColour = value.toLocaleLowerCase();
    this._pdfDocument.setFillColor(this._fillColour);
    this._variables.set("_FILLCOLOUR", this._fillColour);
  }

  private _fontHeight = 0;
  public get fontHeight(): number {
    return this._fontHeight;
  }
  private set fontHeight(value: number) {
    this._fontHeight = value;
    this._variables.set("_FONTHEIGHT", this.setFixedDec(value, 3));
  }

  private _fontName: string = "helvetica";
  public get fontName(): string {
    return this._fontName;
  }
  public set fontName(value: string) {
    this._fontName = value;
    this.setCurrentFont(this.fontName, this.fontStyle);
    this._variables.set("_FONTNAME", value);
  }

  private _fontPointSize = 0;
  public get fontPointSize(): number {
    return this._fontPointSize;
  }
  public set fontPointSize(value: number) {
    if (!value) {
      this.lastError = "Font point size is required";
      this.lastResult = "0";
      return;
    }
    if (isNaN(Number(value))) {
      this.lastError = "Font point size must be a number, received 'NaN'";
      this.lastResult = "0";
      return;
    }
    if (value <= 0) {
      this.lastError = "Font point size must be greater than 0";
      this.lastResult = "0";
      return;
    }
    this._fontPointSize = value;
    this._pdfDocument.setFontSize(value);
    this.fontHeight = this.pointsToUom(value) * this.lineHeightFactor;
    this._variables.set("_FONTPOINTSIZE", value.toString());
  }

  private get lineHeightFactor(): number {
    return (this._pdfDocument as any)["getLineHeightFactor"]
      ? (this._pdfDocument as any)["getLineHeightFactor"]()
      : 1.15;
  }

  private _fontStyle: fontStyleType = "normal";
  public get fontStyle(): fontStyleType {
    return this._fontStyle;
  }
  private set fontStyle(value: fontStyleType) {
    this._fontStyle = value;
    this.setCurrentFont(this.fontName, this.fontStyle);
    this._variables.set("_FONTSTYLE", value);
  }

  private _lastError: string = "";
  public get lastError(): string {
    return this._lastError;
  }
  public set lastError(value: string) {
    this._lastError = value;
    if (value !== "") {
      this._logger.warn(value);
    }
  }

  private _lastImageAdded: string = "";
  public get lastImageAdded(): string {
    return this._lastImageAdded;
  }
  private set lastImageAdded(value: string) {
    this._lastImageAdded = value;
    this._variables.set("_LASTIMAGEADDED", value);
  }

  private _LastImageIndex: number = -1;
  public get lastImageIndex(): number {
    return this._LastImageIndex;
  }
  private set lastImageIndex(value: number) {
    this._LastImageIndex = value;
    this._variables.set("_LASTIMAGEINDEX", value.toString());
  }

  private _lastResult: string = "";
  public get lastResult(): string {
    return this._lastResult;
  }
  public set lastResult(value: string) {
    this._lastResult = value;
    this._variables.set("_LASTRESULT", value);
  }

  private _lineColour = "black";
  public get lineColour(): string {
    return this._lineColour;
  }
  public set lineColour(value: string) {
    this._lineColour = value.toLocaleLowerCase();
    this._pdfDocument.setDrawColor(this._lineColour);
    this._variables.set("_LINECOLOUR", this._lineColour);
  }

  private _lineWidth: number = 0.5;
  public get lineWidth(): number {
    return this._lineWidth;
  }
  public set lineWidth(value: number) {
    this._logger.trace(`Setting line width to ${value}`);
    this._lineWidth = value;
    this._pdfDocument.setLineWidth(value);
    this._variables.set("_LINEWIDTH", value.toString());
  }

  private _logLevel = 2;

  private _pageHeight = 0;
  public get pageHeight(): number {
    return this._pageHeight;
  }
  private set pageHeight(value: number) {
    this._pageHeight = value;
    this._variables.set("_PAGEHEIGHT", this.setFixedDec(value));
  }

  private _pageWidth = 0;
  public get pageWidth(): number {
    return this._pageWidth;
  }
  private set pageWidth(value: number) {
    this._pageWidth = value;
    this._variables.set("_PAGEWIDTH", this.setFixedDec(value));
  }

  private _pageOrientation: orientationType = "portrait";
  public get pageOrientation(): orientationType {
    return this._pageOrientation;
  }
  private set pageOrientation(value: orientationType) {
    this._pageOrientation = value;
    this._variables.set("_CURRENTPAGEORIENTATION", value);
    this.calcPageDimensions(this.PdfDocument);
  }

  private _pageSize: pageSizeType = "a4";
  public get pageSize(): string {
    return this._pageSize;
  }
  private set pageSize(value: string) {
    if (!isValidPageSize(value)) {
      this.lastError = "Invalid page size '" + value + "'";
      this.lastResult = "0";
      return;
    }
    this._pageSize = value as pageSizeType;
    this._variables.set("_CURRENTPAGESIZE", value);
    this.calcPageDimensions(this.PdfDocument);
  }

  private _marginBottom = 0;
  private _marginBottomPt = 0;
  public get marginBottom(): number {
    return this._marginBottom;
  }
  public set marginBottom(value: number) {
    this._marginBottom = value > 0 ? value : 0;
    this._marginBottomPt = this.uomToPoints(value);
    this.calcPageDimensions(this.PdfDocument);
    this._variables.set("_MARGINBOTTOM", value.toString());
  }

  private _marginTop = 0;
  private _marginTopPt = 0;
  public get marginTop(): number {
    return this._marginTop;
  }
  public set marginTop(value: number) {
    this._marginTop = value > 0 ? value : 0;
    this._marginTopPt = this.uomToPoints(value);
    this.calcPageDimensions(this.PdfDocument);
    this._variables.set("_MARGINTOP", value.toString());
  }

  private _marginLeft = 0;
  private _marginLeftPt = 0;
  public get marginLeft(): number {
    return this._marginLeft;
  }
  public set marginLeft(value: number) {
    this._marginLeft = value > 0 ? value : 0;
    this._marginLeftPt = this.uomToPoints(value);
    this.calcPageDimensions(this.PdfDocument);
    this._variables.set("_MARGINLEFT", value.toString());
  }

  private _marginRight = 0;
  private _marginRightPt = 0;
  public get marginRight(): number {
    return this._marginRight;
  }
  public set marginRight(value: number) {
    this._marginRight = value > 0 ? value : 0;
    this._marginRightPt = this.uomToPoints(value);
    this.calcPageDimensions(this.PdfDocument);
    this._variables.set("_MARGINRIGHT", value.toString());
  }

  private _lastObjectHeight = 0;
  public get lastObjectHeight(): number {
    return this._lastObjectHeight;
  }
  private set lastObjectHeight(value: number) {
    this._lastObjectHeight = value;
    this._variables.set("_LASTOBJECTHEIGHT", this.setFixedDec(value));
  }

  private _lastObjectWidth = 0;
  public get lastObjectWidth(): number {
    return this._lastObjectWidth;
  }
  private set lastObjectWidth(value: number) {
    this._lastObjectWidth = value;
    this._variables.set("_LASTOBJECTWIDTH", this.setFixedDec(value));
  }

  private _posnX = 0;
  public get posnX(): number {
    return this._posnX;
  }
  public set posnX(value: number) {
    this._posnX = value > 0 ? value : 0;
    this._variables.set("_CURRENTX", this.setFixedDec(this.posnX));
  }

  private _posnY = 0;
  public get posnY(): number {
    return this._posnY;
  }
  public set posnY(value: number) {
    this._posnY = value > 0 ? value : 0;
    this._variables.set("_CURRENTY", this.setFixedDec(this._posnY));
  }

  private _spaceHoz = 0;
  public get spaceHoz(): number {
    return this._spaceHoz;
  }
  private set spaceHoz(value: number) {
    this._spaceHoz = value > 0 ? value : 0;
    this._variables.set("_SPACEHOZ", this.setFixedDec(value));
  }

  private _spaceVert = 0;
  public get spaceVert(): number {
    return this._spaceVert;
  }
  private set spaceVert(value: number) {
    this._spaceVert = value > 0 ? value : 0;
    this._variables.set("_SPACEVERT", this.setFixedDec(value, 3));
  }

  private _textColour = "";
  public get textColour(): string {
    return this._textColour;
  }
  private set textColour(value: string) {
    this._textColour = value.toLocaleLowerCase();
    this._variables.set("_TEXTCOLOUR", this._textColour);
    this._pdfDocument.setTextColor(this._textColour);
  }

  private get pageCount(): number {
    return this._pdfDocument
      ? this._pdfDocument.internal.getNumberOfPages()
      : -1;
  }

  constructor(options: Partial<IJsPdfOptions>, logger: AppLogger) {
    this._logger = logger;
    const optn = new JsPdfOptions(options);
    this._pdfDocument = new jsPDF(optn);
    this.pageSize = optn.pageSize;
    this.pageOrientation = optn.orientation;
    this.currentUom = optn.unit;
    (this._pdfDocument as any).setLineHeightFactor(1);

    const now = new Date();
    this._variables.set(
      "_TIMEHM",
      now.toLocaleTimeString(undefined, {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
      }),
    );
    this._variables.set(
      "_DATEDDMMYYYY",
      now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    );
    this._variables.set(
      "_DATEMMDDYYYY",
      now.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    );
    this._variables.set("_DATEISO", now.toISOString().substring(0, 10));
    this._variables.set("_IMAGEASPECT", "1");
    this._variables.set("_IMAGEHEIGHT", "0");
    this._variables.set("_IMAGEHEIGHTPX", "0");
    this._variables.set("_IMAGEWIDTH", "0");
    this._variables.set("_IMAGEWIDTHPX", "0");
    this._variables.set("_PAGENO", "1");
    this._variables.set("_PAGES", "1");

    this.posnX = 0;
    this.posnY = 0;
    this.spaceHoz = 0;
    this.spaceVert = 0;
    this.currentPageNumber = 1;

    this.lineWidth = this.pointsToUom(mmToPoints(0.2));
    this.lineColour = "black";
    this.fontPointSize = 12;
    this.fontName = "helvetica";
    this.textColour = "black";
    this.fillColour = "white";
    this.marginTop = this.pixelsToUom(40);
    this.marginLeft = this.marginTop;
    this.marginBottom = this.marginTop;
    this.marginRight = this.marginTop;
  }

  private logAndParseCommand = (command: string, input: string): string => {
    const result = this.substitute(input);
    this._logger.debug(command + " " + result);
    return result;
  };

  public addBookmark(input: string): void {
    const subs = this.logAndParseCommand(".addBookmark", input);

    const { first: parent, rest: rest1 } = getNextNumber(subs);
    const { first: page, rest: title } = getNextNumber(rest1);

    if (title === "") {
      this.lastError = "A bookmark title is required.";
      this.lastResult = "0";
      return;
    }

    if (parent && isNaN(parent)) {
      this.lastError = `The parent Id '${parent}' must be a number.`;
      this.lastResult = "0";
      return;
    }

    if (
      parent < 0 ||
      (this._bookmarks.length > 0 && parent > this._bookmarks.length - 1)
    ) {
      this.lastError = `The parent Id is out of range of 0 to ${this._bookmarks.length - 1}`;
      this.lastResult = "0";
      return;
    }

    if (isNaN(page)) {
      this.lastError = "Page must be a number";
      this.lastResult = "0";
      return;
    }

    if (this._bookmarks.length === 0) {
      this._bookmarks.push({ title: "Root", options: {}, children: [] });
    }

    const outlineParent = parent === 0 ? null : this._bookmarks[parent];
    const bookmark = (this._pdfDocument as any).outline.add(
      outlineParent,
      title,
      { pageNumber: page },
    );
    if (bookmark === null) {
      this.lastError = "Error adding bookmark";
      this.lastResult = "0";
      return;
    }
    this.lastResult = this._bookmarks.length.toString();
    this._bookmarks.push(bookmark);
    if (!outlineParent && this._bookmarks[0]) {
      this._bookmarks[0].children.push(bookmark);
    }
  }

  public addPage(input: string = ""): void {
    let subs = this.logAndParseCommand(".addPage", input);
    let { first: pageSize, rest: rest1 } = getNextString(subs);
    let { first: pageOrientation } = getNextString(rest1);

    pageSize = pageSize.toLocaleLowerCase();
    pageOrientation = pageOrientation.toLocaleLowerCase();

    if (pageSize !== "") {
      this.setPageSize(pageSize);
      if (this.lastResult === "0") {
        return;
      }
    }

    if (pageOrientation !== "") {
      this.setPageOrientation(pageOrientation);
      if (this.lastResult === "0") {
        return;
      }
    }

    this._pdfDocument.addPage(this.pageSize, this.pageOrientation);
    this.posnX = 0;
    this.posnY = 0;
    this._variables.set("_PAGES", this.pageCount.toString());
    this.currentPageNumber = this.pageCount;
    this.calcPageDimensions(this._pdfDocument);
  }

  private calcPageDimensions(document: jsPDF | null): void {
    if (!document) {
      this.pageHeight = 0;
      this.pageWidth = 0;
    } else {
      this.pageHeight =
        document.internal.pageSize.height -
        this._marginTop -
        this._marginBottom;
      this.pageWidth =
        document.internal.pageSize.width - this._marginLeft - this._marginRight;
    }
  }

  public LoadImageFromFile(input: string): void {
    const subs = this.logAndParseCommand(".LoadImageFromFile", input);

    let fileName = subs;

    if (!fileName) {
      this.lastError = "A file name is required.";
      this.lastResult = "0";
      return;
    }

    if (!fs.existsSync(fileName)) {
      this.lastError = "File '" + fileName + "' cannot be found or accessed.";
      this.lastResult = "0";
      return;
    }

    try {
      const image = fs.readFileSync(fileName);
      this.saveImage(image, this.getContentType(fileName));
      this.lastResult = "1";
    } catch (ex) {
      this.lastError = "Error reading file '" + fileName + "'.";
      this.lastResult = "0";
    }
  }

  public async LoadImageFromUrl(input: string): Promise<void> {
    const subs = this.logAndParseCommand(".LoadImageFromUrl", input);

    let url = subs;

    if (!url) {
      this.lastError = "A URL is required.";
      this.lastResult = "0";
      return;
    }

    try {
      const response = await fetch(url, {
        headers: { Accept: "image/*, */*;q=0.8" },
      });
      if (!response.ok) {
        this.lastError = "Error reading image '" + url + "'.";
        this.lastResult = "0";
        return;
      }
      const arrayBuffer = await response.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);
      const mediaType = response.headers.get("content-type") || "image/png";
      this.saveImage(imageBuffer, mediaType);
      this.lastResult = "1";
    } catch (ex) {
      this.lastError = "Error reading file '" + url + "'";
      this.lastResult = "0";
    }
  }

  private saveImage(imageBuffer: Buffer, mediaType: string): void {
    const base64Image = imageBuffer.toString("base64");
    const image = "data:" + mediaType + ";base64," + base64Image;
    this.lastImageAdded = this._images.length.toString();
    this._images.push(image);

    const info = (this._pdfDocument as any).getImageProperties(image);
    this._variables.set(
      "_IMAGEWIDTH",
      this.setFixedDec(this.pixelsToUom(info.width), 3),
    );
    this._variables.set("_IMAGEWIDTHPX", info.width.toString());
    this._variables.set(
      "_IMAGEHEIGHT",
      this.setFixedDec(this.pixelsToUom(info.height), 3),
    );
    this._variables.set("_IMAGEHEIGHTPX", info.height.toString());

    this._variables.set(
      "_IMAGEASPECT",
      info.height > 0 ? this.setFixedDec(info.width / info.height, 3) : "1",
    );
  }

  private getContentType(fileName: string): string {
    const mediaType = fileName.split(".").pop();
    return mediaType ? "image/" + mediaType : "";
  }

  public async checkPage(
    jsPdfDynamo: JsPdfDynamo,
    input: string,
  ): Promise<void> {
    const subs = this.logAndParseCommand(".checkPage", input);

    const { first: overflow, rest } = getNextNumber(subs);

    if (this.posnY > this._pageHeight - overflow) {
      this._logger.debug(
        `* End of page detected at PosnVert: ${this.posnY}, PageHeight: ${this._pageHeight} Overflow: ${overflow}`,
      );
      if (rest.length === 0) {
        this.addPage();
      } else {
        await jsPdfDynamo.processGroups(this, rest, false);
      }
    }
  }

  public drawBox(input: string): void {
    const subs = this.logAndParseCommand(".drawBox", input);

    const { first: left, rest: rest1 } = getNextNumber(subs);
    const { first: top, rest: rest2 } = getNextNumber(rest1);
    const { first: width, rest: rest3 } = getNextNumber(rest2);
    const { first: height, rest: rest4 } = getNextNumber(rest3);
    const { first: boxType } = getNextNumber(rest4);

    if (!this.checkPosition(left, top)) {
      return;
    }

    if (isNaN(width)) {
      this.lastError = `The width of the box is not a number`;
      this.lastResult = "0";
      return;
    }

    if (isNaN(height)) {
      this.lastError = `The height of the box is not a number`;
      this.lastResult = "0";
      return;
    }

    this.posnX = left;
    this.posnY = top;
    let lineWidthAdjustment = this._lineWidth;
    let linePosnAdjustment = lineWidthAdjustment * 0.5;

    const x = this.posnX - linePosnAdjustment + this._marginLeft;
    const y = this.posnY - linePosnAdjustment + this._marginTop;
    const w = width + lineWidthAdjustment * 2;
    const h = height + lineWidthAdjustment * 2;

    let style = "S";
    switch (boxType) {
      case 0:
        break;
      case 1:
        style = "F";
        this._pdfDocument.setFillColor(this.fillColour);
        break;
      case 2:
        style = "FD";
        this._pdfDocument.setFillColor(this.fillColour);
        break;
      default:
        this.lastError = `The box style option '${boxType}' is not valid. It must be '0', '1' or '2'`;
        this.lastResult = "0";
        return;
    }

    this._pdfDocument.rect(x, y, w, h, style);

    this.posnX = this.posnX + width + this.spaceHoz;
    this.posnY = this.posnY + height + this.spaceVert;
    this.lastObjectHeight = height;
    this.lastObjectWidth = width;
    this.lastResult = "1";
  }

  public drawCircle(input: string): void {
    const subs = this.logAndParseCommand(".drawCircle", input);

    const { first: left, rest: rest1 } = getNextNumber(subs);
    const { first: top, rest: rest2 } = getNextNumber(rest1);
    const { first: radius, rest: rest3 } = getNextNumber(rest2);
    const { first: option } = getNextNumber(rest3);

    if (!this.checkPosition(left, top)) {
      return;
    }

    if (isNaN(radius)) {
      this.lastError = `The radius of the circle is not a number`;
      this.lastResult = "0";
      return;
    }

    this.posnX = left;
    this.posnY = top;

    const x = this.posnX + this._marginLeft;
    const y = this.posnY + this._marginTop;
    let r = radius;

    let style = "S";
    switch (option) {
      case 0:
        r -= this._lineWidth * 0.5;
        break;
      case 1:
        style = "F";
        this._pdfDocument.setFillColor(this.fillColour);
        break;
      case 2:
        style = "FD";
        this._pdfDocument.setFillColor(this.fillColour);
        r -= this._lineWidth * 0.5;
        break;
      default:
        this.lastError = `The circle style option '${option}' is not valid. It must be '0', '1' or '2'`;
        this.lastResult = "0";
        return;
    }

    this._pdfDocument.circle(x, y, r, style);

    this.lastObjectHeight = radius * 2;
    this.lastObjectWidth = this.lastObjectHeight;
    this.posnX = this.posnX + radius + this.spaceHoz;
    this.posnY = this.posnY + radius + this.spaceVert;
    this.lastResult = "1";
  }

  public drawDebugGrid(input: string): void {
    const subs = this.logAndParseCommand(".drawDebugGrid", input);

    const savedLineColour = this.lineColour;
    const savedLineWidth = this.lineWidth;
    const savedX = this.posnX;
    const savedY = this.posnY;
    const mm = 0.1;
    const pts = mmToPoints(mm);

    const lineWidth = this.pointsToUom(pts);
    this.lineWidth = lineWidth;
    this.lineColour = "lightgrey";

    let offsetLeft = this._marginLeft;
    let offsetTop = this._marginTop;
    let offsetRight = this._marginRight;
    let offsetBottom = this._marginBottom;
    if (subs.toLocaleUpperCase().startsWith("P")) {
      offsetLeft = 0;
      offsetTop = 0;
      offsetRight = 0;
      offsetBottom = 0;
    } else {
      this.drawBox(`0 0 ${this._pageWidth} ${this._pageHeight} 0`);
    }

    let step = 30;
    switch (this.currentUom) {
      case uomEnum.in:
        step = 0.5;
        break;
      case uomEnum.mm:
        step = 10;
        break;
    }
    let width =
      this._pdfDocument.internal.pageSize.width - offsetLeft - offsetRight;
    let height =
      this._pdfDocument.internal.pageSize.height - offsetTop - offsetBottom;
    let currX = step;
    let counter = 0;
    while (currX < width) {
      counter++;
      this.lineWidth =
        this.currentUom === uomEnum.in && counter % 2 === 0
          ? lineWidth * 4
          : lineWidth;
      this._pdfDocument.line(
        currX + offsetLeft,
        offsetTop,
        currX + offsetLeft,
        height + offsetTop,
      );
      currX = counter * step;
    }

    let currY = step;
    counter = 0;
    while (currY < height) {
      counter++;
      this.lineWidth =
        this.currentUom === uomEnum.in && counter % 2 === 0
          ? lineWidth * 4
          : lineWidth;
      this._pdfDocument.line(
        offsetLeft,
        currY + offsetTop,
        width + offsetLeft,
        currY + offsetTop,
      );
      currY = counter * step;
    }
    this.lineColour = savedLineColour;
    this.lineWidth = savedLineWidth;
    this.posnX = savedX;
    this.posnY = savedY;
  }

  public drawEllipse(input: string): void {
    const subs = this.logAndParseCommand(".drawEllipse", input);

    const { first: left, rest: rest1 } = getNextNumber(subs);
    const { first: top, rest: rest2 } = getNextNumber(rest1);
    const { first: radiusX, rest: rest3 } = getNextNumber(rest2);
    const { first: radiusY, rest: rest4 } = getNextNumber(rest3);
    const { first: option } = getNextNumber(rest4);

    if (!this.checkPosition(left, top)) {
      return;
    }

    if (isNaN(radiusX)) {
      this.lastError = `The horizontal radius of the ellipse is not a number`;
      this.lastResult = "0";
      return;
    }

    if (isNaN(radiusY)) {
      this.lastError = `The vertical radius of the ellipse is not a number`;
      this.lastResult = "0";
      return;
    }

    this.posnX = left;
    this.posnY = top;

    const x = this.posnX + this._marginLeft;
    const y = this.posnY + this._marginTop;
    let rx = radiusX;
    let ry = radiusY;

    let style = "S";
    switch (option) {
      case 0:
        rx -= this._lineWidth * 0.5;
        ry -= this._lineWidth * 0.5;
        break;
      case 1:
        style = "F";
        this._pdfDocument.setFillColor(this.fillColour);
        break;
      case 2:
        style = "FD";
        this._pdfDocument.setFillColor(this.fillColour);
        rx -= this._lineWidth * 0.5;
        ry -= this._lineWidth * 0.5;
        break;
      default:
        this.lastError = `The circle style option '${option}' is not valid. It must be '0', '1' or '2'`;
        this.lastResult = "0";
        return;
    }

    this._pdfDocument.ellipse(x, y, rx, ry, style);

    this.lastObjectHeight = radiusY * 2;
    this.lastObjectWidth = radiusX * 2;
    this.posnX = this.posnX + radiusX + this.spaceHoz;
    this.posnY = this.posnY + radiusY + this.spaceVert;
    this.lastResult = "1";
  }

  public drawLine(input: string): void {
    const subs = this.logAndParseCommand(".drawLine", input);

    const { first: left, rest: rest1 } = getNextNumber(subs);
    const { first: top, rest: rest2 } = getNextNumber(rest1);
    const { first: right, rest: rest3 } = getNextNumber(rest2);
    const { first: bottom } = getNextNumber(rest3);

    if (!this.checkPosition(left, top) && !this.checkPosition(right, bottom)) {
      return;
    }

    this._pdfDocument.line(
      left + this._marginLeft,
      top + this._marginTop,
      right + this._marginLeft,
      bottom + this._marginTop,
    );

    this.lastObjectHeight = bottom - top;
    this.lastObjectWidth = right - left;
    this.lastResult = "1";
  }

  public drawImage(input: string): void {
    const subs = this.logAndParseCommand(".drawImage", input);

    const { first: imageNo, rest: rest1 } = getNextNumber(subs);
    const { first: left, rest: rest2 } = getNextNumber(rest1);
    const { first: top, rest: rest3 } = getNextNumber(rest2);
    let { first: width, rest: rest4 } = getNextNumber(rest3);
    let { first: height, rest: rest5 } = getNextNumber(rest4);
    let { first: scale } = getNextNumber(rest5);

    if (!subs) {
      this.lastError = "An image number must be supplied";
      this.lastResult = "0";
      return;
    }

    if (this._images.length === 0) {
      this.lastError = "No images have been loaded yet";
      this.lastResult = "0";
      return;
    }

    if (isNaN(imageNo) || imageNo < 0 || imageNo > this._images.length - 1) {
      this.lastError =
        this._images.length > 1
          ? `The image number ${imageNo} must be in the range of 0 to ${(this._images.length - 1).toString()}`
          : "Only one image has been loaded, the image number can only be 0";
      this.lastResult = "0";
      return;
    }

    if (!this.checkPosition(left, top)) {
      return;
    }

    const currentImage = this._images[imageNo];
    if (!currentImage) {
      this.lastError = "The image number is not valid!";
      this.lastResult = "0";
      return;
    }

    const info = (this._pdfDocument as any).getImageProperties(currentImage);

    // If the scale is not provided and either the width and height are provided (but not both),
    // determine the scale based on the provided dimension.
    if (
      scale === 0 &&
      ((width === 0 && height > 0) || (width > 0 && height === 0))
    ) {
      scale =
        width === 0
          ? this.pixelsToUom(info.height) / height
          : this.pixelsToUom(info.width) / width;
      height = height === 0 ? this.pixelsToUom(info.height) / scale : height;
      width = width === 0 ? this.pixelsToUom(info.width) / scale : width;
    } else {
      scale = scale === 0 ? 1 : scale;
      height = height === 0 ? this.pixelsToUom(info.height) : height;
      width = width === 0 ? this.pixelsToUom(info.width) : width;
      height = height * scale;
      width = width * scale;
    }

    if (width + left > this._pageWidth) {
      this.lastError = `The image width ${width} plus the left position ${left} is greater than the page width ${this._pageWidth}`;
      this.lastResult = "0";
      return;
    }
    if (height + top > this._pageHeight) {
      this.lastError = `The image height ${height} plus the top position ${top} is greater than the page height ${this._pageHeight}`;
      this.lastResult = "0";
      return;
    }

    this._pdfDocument.addImage(
      currentImage,
      info.format,
      left + this._marginLeft,
      top + this._marginTop,
      width,
      height,
    );

    this.posnX = left + width + this.spaceHoz;
    this.posnY = top + height + this.spaceVert;
    this.lastImageIndex = imageNo;
    this.lastObjectHeight = height;
    this.lastObjectWidth = width;
    this.lastResult = "1";
  }

  public drawText(input: string): void {
    const subs = this.logAndParseCommand(".drawText", input);

    const { first: left, rest: rest1 } = getNextNumber(subs);
    const { first: top, rest: rest2 } = getNextNumber(rest1);

    if (!this.checkPosition(left, top)) {
      return;
    }

    const maxWidth = this.pageWidth - left;
    const lines: string[] = this._pdfDocument.splitTextToSize(rest2, maxWidth);
    this.lastObjectWidth = 0;
    this.lastResult = "1";

    if (lines.length > 1) {
      this.lastError = `Text was truncated to fit within the available width (${rest2.substring(0, 20)}...) on page ${this._currentPageNumber}.`;
      this.lastResult = "0";

      if (lines[0]) {
        if (this._pdfDocument.getTextWidth(lines[0]) < maxWidth) {
          lines[0] += "...";
        } else if (lines[0].length > 3) {
          lines[0] = lines[0].substring(0, lines[0].length - 3) + "...";
        }
      }
    }
    if (lines.length > 0) {
      this._pdfDocument.text(
        lines[0] ? lines[0].trimEnd() : "",
        left + this._marginLeft,
        top + this._marginTop + (this.fontHeight * 0.5) / this.lineHeightFactor,
        { baseline: "middle" },
      );
      this.lastObjectWidth = this._pdfDocument.getTextWidth(
        lines[0] ? lines[0].trimEnd() : "",
      );
    }

    this.lastObjectHeight = this.fontHeight * this.lineHeightFactor;
    this.posnX = left + this.lastObjectWidth + this.spaceHoz;
    this.posnY = top + this.lastObjectHeight + this.spaceVert;
  }

  private checkPosition(left: number, top: number): boolean {
    if (isNaN(left)) {
      this.lastError = `Horizontal position '${left}' is not a number`;
      this.lastResult = "0";
      return false;
    }
    if (isNaN(top)) {
      this.lastError = `Vertical position '${top}' is not a number on page ${this._currentPageNumber}.`;
      this.lastResult = "0";
      return false;
    }
    if (left < 0 || top < 0) {
      this.lastError =
        "Neither the horizontal nor vertical positions can be negative";
      this.lastResult = "0";
      return false;
    }

    if (left > this._pageWidth) {
      this.lastError = `Horizontal position ${left} is greater than the available page width ${this._pageWidth}`;
      this.lastResult = "0";
      return false;
    }

    if (top > this._pageHeight) {
      this.lastError = `Vertical position ${top} is greater than the page height ${this._pageHeight}`;
      this.lastResult = "0";
      return false;
    }
    return true;
  }

  public drawTextBox(input: string): void {
    const subs = this.logAndParseCommand(".drawTextBox", input);

    const { first: left, rest: rest1 } = getNextNumber(subs);
    const { first: top, rest: rest2 } = getNextNumber(rest1);
    const { first: width, rest: rest3 } = getNextNumber(rest2);
    const { first: height, rest: rest4 } = getNextNumber(rest3);
    let { first: alignH, rest: rest5 } = getNextString(rest4);
    let { first: alignV, rest: text } = getNextString(rest5);

    if (!this.checkPosition(left, top)) {
      return;
    }

    if (width <= 0) {
      this.lastError = "Width must be greater than 0.";
      this.lastResult = "0";
      return;
    }
    if (height <= 0) {
      this.lastError = "Height must be greater than 0.";
      this.lastResult = "0";
      return;
    }
    if (left + width > this.pageWidth) {
      this.lastError = `Left position (${left}) plus width (${width}) is greater than the page width (${this.pageWidth}).`;
      this.lastResult = "0";
      return;
    }

    if (top + height > this.pageHeight) {
      this.lastError = `Top position (${top}) plus height (${height}) is greater than the page height (${this.pageHeight}).`;
      this.lastResult = "0";
      return;
    }

    alignH = alignH.toLocaleLowerCase().trim();
    if (alignH === "") {
      this.lastError = "Horizontal alignment is required.";
      this.lastResult = "0";
      return;
    }

    alignV = alignV.toLocaleLowerCase().trim();
    if (alignV === "") {
      this.lastError = "Vertical alignment is required";
      this.lastResult = "0";
      return;
    }

    if (text === "") {
      this.lastError = "Text is required.";
      this.lastResult = "0";
      return;
    }

    let horzAlign: alignmentType = "center";
    let horzAdjust = 0;
    let vertAlign = "top";
    switch (alignH.substring(0, 1)) {
      case "l":
        horzAlign = "left";
        break;
      case "r":
        horzAlign = "right";
        horzAdjust = width;
        break;
      case "c":
        horzAlign = "center";
        horzAdjust = width * 0.5;
        break;
      default:
        this.lastError = `Invalid horizontal alignment value '${alignH}'.`;
        this.lastResult = "0";
        return;
    }
    switch (alignV.substring(0, 1)) {
      case "t":
        vertAlign = "top";
        break;
      case "c":
        vertAlign = "center";
        break;
      case "b":
        vertAlign = "bottom";
        break;
      default:
        this.lastError = `Invalid vertical alignment value '${alignV}'.`;
        this.lastResult = "0";
        return;
    }

    const lines: string[] = this._pdfDocument.splitTextToSize(text, width);
    let textHeight = this.fontHeight * lines.length;
    while (textHeight > height) {
      this._logger.warn(
        `Text does not fit within the box, dropped '${lines[lines.length - 1]}'`,
      );
      lines.pop();
      textHeight = this.fontHeight * lines.length * this.lineHeightFactor;
    }
    if (lines.length === 0) {
      this.lastError = "Text cannot fit within the box";
      this.lastResult = "0";
      return;
    }

    let adjustTop = 0;
    if (vertAlign === "center") {
      adjustTop = (height - textHeight) / 2;
    } else if (vertAlign === "bottom") {
      adjustTop = height - textHeight;
    }
    this._pdfDocument.text(
      lines,
      left + this._marginLeft + horzAdjust,
      top +
        this._marginTop +
        adjustTop +
        (this.fontHeight * 0.5) / this.lineHeightFactor,
      { align: horzAlign, baseline: "middle" },
    );

    this.lastObjectHeight = height;
    this.lastObjectWidth = width;
    this.posnX = left + this.lastObjectWidth + this.spaceHoz;
    this.posnY = top + this.lastObjectHeight + this.spaceVert;
    this.lastResult = "1";
  }

  public async drawTextWrapped(
    jsPdfDynamo: JsPdfDynamo,
    input: string,
  ): Promise<void> {
    const subs = this.logAndParseCommand(".drawTextWrapped", input);

    const { first: left, rest: rest1 } = getNextNumber(subs);
    const { first: top, rest: rest2 } = getNextNumber(rest1);
    const { first: maxWidth, rest: rest3 } = getNextNumber(rest2);
    let { first: cmdGroup, rest: text } = getNextString(rest3);

    if (!this.checkPosition(left, top)) {
      return;
    }
    if (maxWidth <= 0) {
      this.lastError = "Maximum width must be greater than 0";
      this.lastResult = "0";
      return;
    }
    if (text === "") {
      this.lastError = "No text has been provided";
      this.lastResult = "0";
      return;
    }

    let lastObjectHeight = 0;
    text = text.replace(/\\[nN]/g, " \n") + " ";
    const splitText = text.split("\n");
    const lines: string[] = [];
    for (let line of splitText) {
      lines.push(...this._pdfDocument.splitTextToSize(line, maxWidth));
    }
    if (lines.length > splitText.length) {
      this._logger.trace(`Text was wrapped into ${lines.length} lines`, lines);
    }
    this.posnY = top;

    while (lines.length > 0) {
      if (!cmdGroup.startsWith("*")) {
        // On page overflow, cmdGroup should be causing posnY to be changed
        await jsPdfDynamo.processGroups(this, cmdGroup, false);
      }
      this.drawText(
        `${left.toFixed(2)} ${this.posnY.toFixed(2)} ${lines[0] ? lines[0].trimEnd() : ""}`,
      );
      lines.shift();
      lastObjectHeight += this.fontHeight * this.lineHeightFactor;
      if (
        this.posnY > this.pageHeight &&
        text !== "" &&
        cmdGroup.startsWith("*")
      ) {
        this.addPage();
        this.posnY = 0;
      }
    }
    this.posnX = left + maxWidth + this.spaceHoz;
    this.lastObjectHeight = lastObjectHeight;
    this.lastObjectWidth = maxWidth;
  }

  public async forEachPage(
    jsPdfDynamo: JsPdfDynamo,
    input: string,
  ): Promise<void> {
    const subs = this.logAndParseCommand(".forEachPage", input);

    for (let ix = 1; ix <= this.pageCount; ix++) {
      this._pdfDocument.setPage(ix);
      this.currentPageNumber = ix;
      await jsPdfDynamo.processGroups(this, subs);
    }
    this.lastResult = "1";
  }

  public async ifBlank(jsPdfDynamo: JsPdfDynamo, input: string): Promise<void> {
    let { first: variable, rest } = getNextString(input);
    let subs = this.substitute(rest.trim());
    this._logger.debug(".ifBlank " + variable + " " + subs);

    let value = this._variables.get(variable.toLocaleUpperCase()) || "";

    this.lastResult = "-1";
    if (value.trim() === "") {
      await jsPdfDynamo.processDot(this, rest);
    }
  }

  public async ifEq(jsPdfDynamo: JsPdfDynamo, input: string): Promise<void> {
    const { first: value1, rest: rest1 } = getNextString(input);
    const { first: value2, rest: rest2 } = getNextString(rest1);
    const subs = this.substitute(rest2.trim());
    this._logger.debug(`.ifEq ${value1} ${value2} ${subs}`);

    const variable1 = this.substitute(value1);
    const variable2 = this.substitute(value2);

    this.lastResult = "0";
    if (!Number(variable1) || !Number(variable2)) {
      let compareResult = variable1.localeCompare(variable2);
      if (compareResult === 0) {
        await jsPdfDynamo.processDot(this, subs);
      }
    } else {
      if (Number(variable1) === Number(variable2)) {
        await jsPdfDynamo.processDot(this, subs);
      }
    }
  }
  public async ifNe(jsPdfDynamo: JsPdfDynamo, input: string): Promise<void> {
    const { first: value1, rest: rest1 } = getNextString(input);
    const { first: value2, rest: rest2 } = getNextString(rest1);
    const subs = this.substitute(rest2.trim());
    this._logger.debug(`.ifNe ${value1} ${value2} ${subs}`);

    const variable1 = this.substitute(value1);
    const variable2 = this.substitute(value2);

    this.lastResult = "0";
    if (!Number(variable1) || !Number(variable2)) {
      let compareResult = variable1.localeCompare(variable2);
      if (compareResult !== 0) {
        await jsPdfDynamo.processDot(this, subs);
      }
    } else {
      if (Number(variable1) !== Number(variable2)) {
        await jsPdfDynamo.processDot(this, subs);
      }
    }
  }

  public async ifGt(jsPdfDynamo: JsPdfDynamo, input: string): Promise<void> {
    const { first: value1, rest: rest1 } = getNextString(input);
    const { first: value2, rest: rest2 } = getNextString(rest1);
    const subs = this.substitute(rest2.trim());
    this._logger.debug(`.ifGt ${value1} ${value2} ${subs}`);

    const variable1 = this.substitute(value1);
    const variable2 = this.substitute(value2);

    this.lastResult = "0";
    if (!Number(variable1) || !Number(variable2)) {
      let compareResult = variable1.localeCompare(variable2);
      if (compareResult > 0) {
        await jsPdfDynamo.processDot(this, rest2);
      }
    } else {
      if (Number(variable1) > Number(variable2)) {
        await jsPdfDynamo.processDot(this, rest2);
      }
    }
  }

  public async ifNotBlank(
    jsPdfDynamo: JsPdfDynamo,
    input: string,
  ): Promise<void> {
    let { first: value1, rest } = getNextString(input);
    const subs = this.substitute(rest.trim());
    this._logger.debug(".ifNotBlank " + value1 + " " + subs);

    const variable1 = this.substitute(value1);
    let value = this._variables.get(variable1.toLocaleUpperCase()) || "";

    this.lastResult = "-1";
    if (value.trim() !== "") {
      await jsPdfDynamo.processDot(this, rest);
    }
  }

  public incCurrentX(input: string): void {
    let subs = this.logAndParseCommand(".incCurrentX", input);

    while (subs.length > 0) {
      const { first: value, rest } = getNextNumber(subs);
      subs = rest;
      if (!Number.isNaN(value)) {
        this.posnX = this.posnX + value;
      }
    }
    this.lastResult = "1";
    if (this.posnX < 0) {
      this.posnX = 0;
      this.lastError = "X Position resulted in negative value, adjusted to 0";
    }
    if (this.posnX > this._pageWidth) {
      this.posnX = this._pageWidth;
      this.lastError = "X Position exceeded page width, adjusted to page width";
    }
  }

  public incCurrentY(input: string): void {
    let subs = this.logAndParseCommand(".incCurrentY", input);

    while (subs.length > 0) {
      const { first: value, rest } = getNextNumber(subs);
      subs = rest;
      if (!Number.isNaN(value)) {
        this.posnY += value;
      }
    }
    this.lastResult = "1";
    if (this.posnY < 0) {
      this.posnY = 0;
      this.lastError = "Y Position resulted in negative value, adjusted to 0";
    }
    if (this.posnY > this._pageHeight) {
      this.lastError = `Y Position ${this.posnY} exceeded page ${this._currentPageNumber} height, adjusted to page height (${this._pageHeight})`;
      this.posnY = this._pageHeight;
    }
  }

  public incVar(input: string): void {
    const subs = this.logAndParseCommand(".incVar", input);
    let { first: varName, rest } = getNextString(subs.toLocaleUpperCase());

    if (varName === "") {
      this.lastResult = "0";
      this.lastError = "IncVar must reference a variable";
      return;
    }

    if (varName.startsWith("_")) {
      this.lastResult = "0";
      this.lastError =
        "IncVar can not be used to update system maintained variables";
      return;
    }

    let varValue = this._variables.get(varName);
    if (!varValue) {
      this.lastResult = "0";
      this.lastError = "Variable '" + varName + "' is not defined";
      return;
    }

    if (isNaN(Number(varValue))) {
      this._variables.set(varName, "0");
    }

    while (rest.length > 0) {
      const { first: nextOp, rest: remainder } = getNextNumber(rest, 4);
      rest = remainder;
      let varValue = this._variables.get(varName);
      if (!isNaN(Number(varValue)) && !isNaN(Number(nextOp))) {
        this._variables.set(
          varName,
          removeTrailingZeros((Number(varValue) + nextOp).toFixed(4)),
        );
      }
    }
    this.lastResult = "1";
    this._logger.trace(
      "Variable " + varName + " incremented to " + this._variables.get(varName),
    );
  }

  public divVar(input: string): void {
    let subs = this.substitute(input.trim());
    this._logger.debug(".divVar " + subs);

    let { first: varName, rest } = getNextString(subs.toLocaleUpperCase());

    if (varName === "") {
      this.lastResult = "0";
      this.lastError = "DivVar must reference a variable";
      return;
    }

    if (varName.startsWith("_")) {
      this.lastResult = "0";
      this.lastError =
        "DivVar can not be used to update system maintained variables";
      return;
    }

    let varValue = this._variables.get(varName);
    if (!varValue) {
      this.lastResult = "0";
      this.lastError = "Variable '" + varName + "' is not defined";
      return;
    }

    if (isNaN(Number(varValue))) {
      this._variables.set(varName, "0");
    }

    while (rest.length > 0) {
      const { first: nextOp, rest: remainder } = getNextNumber(rest, 4);
      rest = remainder;
      let varValue = this._variables.get(varName);
      if (!isNaN(Number(nextOp)) && Number(nextOp) === 0) {
        this.lastResult = "0";
        this.lastError = "Divide by zero error";
        return;
      }
      if (!isNaN(Number(varValue)) && !isNaN(Number(nextOp))) {
        this._variables.set(
          varName,
          removeTrailingZeros((Number(varValue) / Number(nextOp)).toFixed(4)),
        );
      }

      varValue = this._variables.get(varName)!;
    }
    this.lastResult = "1";
    this._logger.trace(
      "Variable " + varName + " incremented to " + this._variables.get(varName),
    );
  }

  public multVar(input: string): void {
    let subs = this.substitute(input.trim());
    this._logger.debug(".multVar " + subs);

    let { first: varName, rest } = getNextString(subs.toLocaleUpperCase());

    if (varName === "") {
      this.lastResult = "0";
      this.lastError = "MultVar must reference a variable";
      return;
    }

    if (varName.startsWith("_")) {
      this.lastResult = "0";
      this.lastError =
        "MultVar can not be used to update system maintained variables";
      return;
    }

    let varValue = this._variables.get(varName);
    if (!varValue) {
      this.lastResult = "0";
      this.lastError = "Variable '" + varName + "' is not defined";
      return;
    }

    if (isNaN(Number(varValue))) {
      this._variables.set(varName, "0");
    }

    while (rest.length > 0) {
      const { first: nextOp, rest: remainder } = getNextNumber(rest, 4);
      rest = remainder;
      let varValue = this._variables.get(varName);
      if (!isNaN(Number(varValue)) && !isNaN(Number(nextOp))) {
        this._variables.set(
          varName,
          removeTrailingZeros((Number(varValue) * Number(nextOp)).toFixed(4)),
        );
      }

      varValue = this._variables.get(varName)!;
    }
    this.lastResult = "1";
    this._logger.trace(
      "Variable " + varName + " incremented to " + this._variables.get(varName),
    );
  }

  public savePdf(input: string): void {
    let subs = this.logAndParseCommand(".savePdf", input.trim());

    if (isBrowser()) {
      this.lastError = "SavePdf is not supported in the browser";
      this.lastResult = "0";
      return;
    }

    if (subs.length === 0) {
      subs = "Document";
    }

    if (!subs.toLocaleUpperCase().endsWith(".PDF")) {
      subs = subs + ".pdf";
    }

    try {
      this._pdfDocument.save(subs);
      this.lastResult = "1";
    } catch (ex) {
      this._logger.error("Problem saving to " + subs);
      this.lastResult = "0";
    }
  }

  public selectPage(input: string): void {
    const subs = this.logAndParseCommand(".selectPage", input);

    const { first: pageNo } = getNextNumber(subs);

    if (!subs) {
      this.lastError = "A page number must be supplied";
      this.lastResult = "0";
      return;
    }

    if (isNaN(pageNo) || pageNo <= 0 || pageNo > this.pageCount) {
      this.lastError =
        "The page number must be in the range of 1 to " + this.pageCount;
      this.lastResult = "0";
      return;
    }
    this._pdfDocument.setPage(pageNo);
    this.currentPageNumber = pageNo;
    this.lastResult = pageNo.toString();
    this.posnX = 0;
    this.posnY = 0;
  }

  private setCurrentFont(fontName: string, fontStyle: string): void {
    this._pdfDocument.setFont(fontName, fontStyle);
  }

  public setCurrentX(input: string): void {
    const subs = this.logAndParseCommand(".setCurrentX", input);
    const { first: x } = getNextNumber(subs);
    this.posnX = x;
    this.lastResult = "1";
  }

  public setCurrentY(input: string): void {
    const subs = this.logAndParseCommand(".setCurrentY", input);
    const { first: y } = getNextNumber(subs);
    this.posnY = y;
    this.lastResult = "1";
  }

  public setDocumentInfo(input: string): void {
    let subs = this.substitute(input);
    this._logger.debug(".setDocumentInfo " + subs);

    let { first, rest } = getNextString(subs);
    this.lastResult = "1";
    switch (first.toLocaleLowerCase()) {
      case "application":
        this._pdfDocument.setProperties({ application: rest });
        break;
      case "author":
        this._pdfDocument.setProperties({ author: rest });
        break;
      case "creator":
        this._pdfDocument.setProperties({ creator: rest });
        break;
      case "keywords":
        this._pdfDocument.setProperties({ keywords: rest });
        break;
      case "subject":
        this._pdfDocument.setProperties({ subject: rest });
        break;
      case "title":
        this._pdfDocument.setProperties({ title: rest });
        break;
      default:
        this.lastResult = "0";
        this.lastError = "Unknown document info field " + first;
        break;
    }
  }

  public setFillColour(input: string): void {
    const subs = this.logAndParseCommand(".setFillColour", input);
    const { first: fillColour } = getNextString(subs);

    if (fillColour === "") {
      this.lastResult = "0";
      this.lastError = "A fill colour must be specified";
      return;
    }

    this.fillColour = fillColour;
    this.lastResult = "1";
  }

  public setFontName(input: string): void {
    const subs = this.logAndParseCommand(".setFontName", input);

    const { first: fontName } = getNextString(subs);
    if (fontName === "") {
      this.lastResult = "0";
      this.lastError = "A font name must be specified";
      return;
    }

    this.fontName = fontName;
    this.lastResult = "1";
  }

  public setFontSize(input: string): void {
    const subs = this.logAndParseCommand(".setFontSize", input);

    if (subs === "") {
      this.lastResult = "0";
      this.lastError = "A font size must be specified";
      return;
    }

    let { first: sizeAlpha } = getNextNumber(subs);
    const size = Number(sizeAlpha);
    if (Number.isNaN(size)) {
      this.lastResult = "0";
      this.lastError = `A font size must be a number. '${sizeAlpha}' is not a number.`;
      return;
    }

    if (size <= 0) {
      this.lastResult = "0";
      this.lastError = "A font size must be greater than 0";
      return;
    }

    this.fontPointSize = size;
    this.lastResult = "1";
  }

  public setFontStyle(input: string): void {
    const subs = this.logAndParseCommand(".setFontStyle", input);

    const { first: fontStyle } = getNextString(subs.toLocaleLowerCase());
    if (fontStyle === "") {
      this.lastResult = "0";
      this.lastError = "A font style must be specified";
      return;
    }
    if (!isValidFontStyle(fontStyle)) {
      this.lastResult = "0";
      this.lastError = "Invalid font style " + fontStyle;
      return;
    }

    this.fontStyle = fontStyle as fontStyleType;
    this.lastResult = "1";
  }

  public setLineColour(input: string): void {
    const subs = this.logAndParseCommand(".setFontStyle", input);
    const { first: lineColour } = getNextString(subs);

    if (lineColour === "") {
      this.lastResult = "0";
      this.lastError = "A line colour must be specified";
      return;
    }

    this.lineColour = lineColour;
    this.lastResult = "1";
  }

  public setLineWidth(input: string): void {
    const subs = this.logAndParseCommand(".setLineWidth", input);
    const { first: width } = getNextNumber(subs);
    if (!Number.isNaN(width) && width > 0) {
      this.lineWidth = width;
      this.lastResult = "1";
    } else {
      this.lastResult = "0";
      this.lastError = `Invalid line width 'width'`;
    }
  }

  public setLogLevel(input: string): void {
    const subs = this.logAndParseCommand(".setLogLevel", input);
    const { first: logLevel } = getNextString(subs);
    if (!this._logger.logLevel) {
      this.lastResult = "0";
      this.lastError = "The logger does not support setting the log level.";
      return;
    }
    if (logLevel === "") {
      this.lastResult = "0";
      this.lastError = "A log level must be specified.";
      return;
    }

    if (Number.isNaN(Number(logLevel))) {
      this._logger.logLevel(logLevel);
    } else {
      this._logger.logLevel(Number(logLevel));
    }
    this.lastResult = "1";
  }

  public setMargin(input: string): void {
    this.lastResult = "1";
    let subs = this.substitute(input);
    this._logger.debug(".setMargin " + subs);
    const { first: marginType, rest } = getNextString(subs.toLocaleUpperCase());
    const { first: size } = getNextNumber(rest);

    if (marginType.startsWith("A")) {
      this.marginLeft = size;
      this.marginRight = size;
      this.marginTop = size;
      this.marginBottom = size;
    } else if (marginType.startsWith("H")) {
      this.marginLeft = size;
      this.marginRight = size;
    } else if (marginType.startsWith("V")) {
      this.marginTop = size;
      this.marginBottom = size;
    } else if (marginType.startsWith("L")) {
      this.marginLeft = size;
    } else if (marginType.startsWith("R")) {
      this.marginRight = size;
    } else if (marginType.startsWith("T")) {
      this.marginTop = size;
    } else if (marginType.startsWith("B")) {
      this.marginBottom = size;
    } else {
      this.lastResult = "0";
    }

    // if (this._lastResult === "1" && this._currentPage) {
    //   this.calcPageDimensions(this._currentPage);
    // }
  }

  private setPageOrientation(input: string): void {
    let subs = this.substitute(input);
    const { first: orientation } = getNextString(subs.toLocaleLowerCase());
    this.lastResult = "1";

    if (orientation.startsWith("l")) {
      this.pageOrientation = "landscape";
    } else if (orientation.startsWith("p")) {
      this.pageOrientation = "portrait";
    } else {
      this.lastResult = "0";
      this.lastError = `Invalid page orientation '${orientation}'.`;
    }
  }

  private setPageSize(input: string): void {
    let subs = this.substitute(input);
    const { first: ps } = getNextString(subs.toLocaleLowerCase());

    if (ps === "") {
      this.lastResult = "0";
      this.lastError = "A page size must be specified";
      return;
    }

    if (isValidPageSize(ps)) {
      this.pageSize = ps as pageSizeType;
      this.lastResult = "1";
    } else {
      this.lastResult = "0";
      this.lastError = "Invalid page size " + ps;
    }
  }

  public setSpaceHoz(input: string): void {
    const subs = this.logAndParseCommand(".setSpaceHoz", input);

    const { first: size } = getNextNumber(subs);
    this.spaceHoz = size;
    this.lastResult = "1";
  }

  public setSpaceVert(input: string): void {
    const subs = this.logAndParseCommand(".setSpaceVert", input);
    const { first: size } = getNextNumber(subs);
    this.spaceVert = size;
    this.lastResult = "1";
  }

  public setTextColour(input: string): void {
    const subs = this.logAndParseCommand(".setTextColour", input);
    const { first: textColour } = getNextString(subs);

    if (textColour === "") {
      this.lastResult = "0";
      this.lastError = "A text colour must be specified";
      return;
    }
    this.textColour = textColour;
    this.lastResult = "1";
  }

  public copyVar(input: string): void {
    let subs = this.substitute(input);
    this._logger.debug(".copyVar " + subs);
    const { first: varName, rest: fromVar } = getNextString(
      subs.toLocaleUpperCase(),
    );

    if (varName === "" || fromVar === "") {
      this.lastResult = "0";
      this.lastError =
        "The CopyVar command requires two variable names to be specified";
    } else if (varName.startsWith("_")) {
      this.lastError =
        "The CopyVar command can not be used to update system maintained variables";
      this.lastResult = "0";
    } else {
      let value = this._variables.get(fromVar);
      if (value) {
        this._variables.set(varName, value);
        this.lastResult = "1";
      } else {
        this._variables.set(varName, "");
        this.lastResult = "0";
        this.lastError = "Variable '" + fromVar + "' is not defined";
      }
    }
  }

  public getVar(variableName: string): string {
    const value = this._variables.get(variableName.toLocaleUpperCase());
    this.lastResult = value ? "1" : "0";
    this.lastError = value
      ? this.lastError
      : "Variable '" + variableName + "' is not defined";
    return value || "";
  }

  public setVar(input: string): void {
    let subs = this.substitute(input);
    this._logger.debug(".setVar " + subs);
    let { first: varName, rest } = getNextString(subs);
    varName = varName.toLocaleUpperCase();

    if (varName === "") {
      this.lastError =
        "The SetVar command requires a variable name to be specified";
      this.lastResult = "0";
      return;
    }

    if (varName.startsWith("_")) {
      this.lastError =
        "The SetVar command can not be used to modify system maintained variables";
      this.lastResult = "0";
      return;
    }
    this._variables.set(varName, rest);
    this.lastResult = "1";
  }

  public substitute(input: string): string {
    let result = input;
    let upperInput = input.toUpperCase();
    let subsDelimiter = "%";

    let ix = upperInput.indexOf(subsDelimiter);
    do {
      if (ix === upperInput.length - 1) {
        break;
      }

      let iy = upperInput.indexOf(subsDelimiter, ix + 1);
      if (iy === -1) {
        break;
      }

      if (iy === ix + 1) {
        upperInput = upperInput.slice(0, ix) + upperInput.slice(ix + 1);
        result = result.slice(0, ix) + result.slice(ix + 1);
        if (ix === upperInput.length - 1) {
          break;
        }
        ix++;
        ix = upperInput.indexOf(subsDelimiter, ix);
        continue;
      }

      let valueName = upperInput.substring(ix + 1, iy).trim();
      let value = this._variables.get(valueName) || "";

      result = result.slice(0, ix) + result.slice(iy + 1);
      if (ix === upperInput.length - 1) {
        result = result + value;
        break;
      }

      result = result.slice(0, ix) + value + result.slice(ix);
      upperInput = result.toUpperCase();
      ix = ix + value.length;
      ix = upperInput.indexOf(subsDelimiter, ix);
    } while (ix > -1);

    return result;
  }

  public writeLog(input: string): void {
    const result = this.substitute(input);
    const { first: level, rest } = getNextString(result);

    switch (level.toLocaleLowerCase()) {
      case "0":
      case "trace":
        this._logger.trace(rest);
        break;
      case "1":
      case "debug":
        this._logger.debug(rest);
        break;
      case "2":
      case "info":
        this._logger.info(rest);
        break;
      case "3":
      case "warn":
        this._logger.warn(rest);
        break;
      case "4":
      case "error":
        this._logger.error(rest);
        break;
    }
  }

  private pixelsToUom(value: number): number {
    switch (this.currentUom) {
      case "mm":
        return pixelsToMm(value);
      case "in":
        return pixelsToInches(value);
      case "pt":
        return pixelsToPoints(value);
    }
    return value;
  }

  private pointsToUom(points: number): number {
    switch (this.currentUom) {
      case "mm":
        return pointsToMm(points);
      case "in":
        return pointsToInches(points);
      case "pt":
        return pointsToPixels(points);
    }
    return points;
  }

  private uomToPoints(value: number): number {
    switch (this.currentUom) {
      case "mm":
        return mmToPoints(value);
      case "in":
        return inchesToPoints(value);
    }
    return value;
  }

  private setFixedDec(value: number, places: number = 2): string {
    return value.toFixed(places);
  }
}
