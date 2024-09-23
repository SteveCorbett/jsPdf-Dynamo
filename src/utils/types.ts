export type alignmentType = "left" | "center" | "right" | "justify";

export type fontStyleType = "bold" | "italic" | "normal" | "bolditalic";
export function isValidFontStyle(fontStyle: string): boolean {
  return ["bold", "italic", "normal", "bolditalic"].includes(fontStyle);
}

export type orientationType = "portrait" | "p" | "landscape" | "l";

export type uomType = "mm" | "in" | "pt";
export enum uomEnum {
  mm = "mm",
  in = "in",
  pt = "pt",
}
