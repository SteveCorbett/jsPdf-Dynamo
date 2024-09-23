export function removeTrailingZeros(numString: string): string {
  if (
    !numString.includes(".") ||
    numString.includes("e") ||
    numString.includes("E") ||
    numString.includes("Infinity") ||
    isNaN(Number(numString))
  ) {
    return numString;
  }

  let trimmedString = numString.trim();
  let decimalIndex = trimmedString.indexOf(".");

  while (trimmedString.length > decimalIndex && trimmedString.endsWith("0")) {
    trimmedString = trimmedString.substring(0, trimmedString.length - 1);
  }

  if (trimmedString.endsWith(".")) {
    return trimmedString.substring(0, trimmedString.length - 1);
  }

  return trimmedString;
}

export function getNextNumber(
  input: string,
  maxPlaces: number = -1,
): { first: number; rest: string } {
  let first = 0;
  let rest = "";

  if (!input) {
    return { first, rest };
  }

  input = input.trimStart();

  if (input.length === 0) {
    return { first, rest };
  }

  let firstValue: string;
  let ix = input.indexOf(" ");
  if (ix < 0) {
    firstValue = input;
  } else {
    firstValue = input.substring(0, ix);
    rest = input.slice(ix).trimStart();
  }
  if (maxPlaces < 0) {
    first = Number(firstValue);
  } else {
    first = Number(Number(firstValue).toFixed(maxPlaces));
  }
  return { first, rest };
}

export function getNextString(input: string): { first: string; rest: string } {
  let first = "";
  let rest = "";

  input = input.trimStart();

  if (input.length === 0) {
    return { first, rest };
  }

  let ix = input.indexOf(" ");
  if (ix < 0) {
    first = input;
  } else {
    first = input.substring(0, ix);
    rest = input.slice(ix).trimStart();
  }

  return { first, rest };
}

export function isBrowser(): boolean {
  return typeof process === "object" && process + "" === "[object process]"
    ? false
    : true;
}

export function pointsToMm(points: number): number {
  return points === null || points === undefined
    ? points
    : Number((points * 0.352777778).toFixed(4));
}

export function mmToPoints(mm: number): number {
  return mm === null || mm === undefined
    ? mm
    : Number((mm / 0.352777778).toFixed(4));
}

export function pointsToInches(points: number): number {
  return points === null || points === undefined
    ? points
    : Number((points * 0.0138888611).toFixed(4));
}

export function inchesToPoints(inches: number): number {
  return inches === null || inches === undefined
    ? inches
    : Number((inches / 0.0138888611).toFixed(4));
}

export function mmToPixels(mm: number, dpi: number = 96): number {
  return mm === null || mm === undefined || isNaN(mm) || isNaN(dpi) || dpi <= 0
    ? mm
    : Number(((mm * dpi) / 25.4).toFixed(4));
}

export function pixelsToMm(pixels: number, dpi: number = 96): number {
  return pixels === null ||
    pixels === undefined ||
    isNaN(pixels) ||
    isNaN(dpi) ||
    dpi <= 0
    ? pixels
    : Number(((pixels * 25.4) / dpi).toFixed(4));
}

export function inchesToPixels(inches: number, dpi: number = 96): number {
  return inches === null ||
    inches === undefined ||
    isNaN(inches) ||
    isNaN(dpi) ||
    dpi <= 0
    ? inches
    : Number((inches * dpi).toFixed(4));
}

export function pixelsToInches(pixels: number, dpi: number = 96): number {
  return pixels === null ||
    pixels === undefined ||
    isNaN(pixels) ||
    isNaN(dpi) ||
    dpi <= 0
    ? pixels
    : Number((pixels / dpi).toFixed(4));
}

export function pointsToPixels(points: number, dpi: number = 96): number {
  return points === null ||
    points === undefined ||
    isNaN(points) ||
    isNaN(dpi) ||
    dpi <= 0
    ? points
    : Number(((points * dpi) / 72).toFixed(4));
}

export function pixelsToPoints(pixels: number, dpi: number = 96): number {
  return pixels === null ||
    pixels === undefined ||
    isNaN(pixels) ||
    isNaN(dpi) ||
    dpi <= 0
    ? pixels
    : Number(((pixels * 72) / dpi).toFixed(4));
}
