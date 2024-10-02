import type { pageSizeType } from "../utils/page.utils";
import type { orientationType, uomType } from "../utils/types";

export interface IJsPdfOptions {
  compress: boolean;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  pageSize: pageSizeType;
  putOnlyUsedFonts: boolean;
  orientation: "portrait" | "landscape" | "p" | "l";
  unit: "mm" | "in" | "pt";
}

export class JsPdfOptions {
  compress = true
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  pageSize: pageSizeType;
  putOnlyUsedFonts = true;
  orientation: orientationType;
  unit: uomType;

  constructor(options: Partial<IJsPdfOptions> = {}) {
    this.pageSize =
      (options.pageSize?.toLocaleLowerCase() as pageSizeType) || "a4";
    this.orientation =
      (options.orientation?.toLocaleLowerCase() as orientationType) ||
      "portrait";
    this.unit = (options.unit?.toLocaleLowerCase() as uomType) || "mm";
    let defaultMargin: number;
    switch (this.unit) {
      case "mm":
        defaultMargin = 10;
        break;
      case "in":
        defaultMargin = 0.4;
        break;
      case "pt":
        defaultMargin = 28;
        break;
    }
    this.margins = Object.assign(
      {
        top: defaultMargin,
        bottom: defaultMargin,
        left: defaultMargin,
        right: defaultMargin,
      },
      options.margins,
    );
  }
}
