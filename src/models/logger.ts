export interface ILogger {
  debug: (message: string, ...args: any | null) => void;
  error: (message: string, ...args: any | null) => void;
  info: (message: string, ...args: any | null) => void;
  trace: (message: string, ...args: any | null) => void;
  warn: (message: string, ...args: any | null) => void;
}

export class AppLogger implements ILogger {
  private _logLevel = 2;
  private _logger: ILogger;

  constructor(logger: ILogger | null = null) {
    if (logger) {
      this._logger = logger;
    } else {
      this._logger = console;
    }
  }

  public trace(message: string, ...args: any | null): void {
    this.canLog(0) ? this._logger.trace(message, args) : null;
  }
  public debug(message: string, ...args: any | null): void {
    this.canLog(1) ? this._logger.debug(message, args) : null;
  }

  public info(message: string, ...args: any | null): void {
    this.canLog(2) ? this._logger.info(message, args) : null;
  }

  public warn(message: string, ...args: any | null): void {
    this.canLog(3) ? this._logger.warn(message, args) : null;
  }

  public error(message: string, ...args: any | null): void {
    this.canLog(4) ? this._logger.error(message, args) : null;
  }

  public logLevel(newLevel: string | number): void {
    if (typeof newLevel === "string") {
      const level = newLevel.toLowerCase();
      switch (level) {
        case "trace":
          this._logLevel = 0;
          break;
        case "debug":
          this._logLevel = 1;
          break;
        case "info":
          this._logLevel = 2;
          break;
        case "warn":
          this._logLevel = 3;
          break;
        case "error":
          this._logLevel = 4;
          break;
        case "silent":
          this._logLevel = 5;
          break;
      }
    } else {
      if (newLevel >= 0 && newLevel <= 5) {
        this._logLevel = newLevel;
      }
    }
  }

  private canLog(level: number): boolean {
    return level >= this._logLevel;
  }
}
