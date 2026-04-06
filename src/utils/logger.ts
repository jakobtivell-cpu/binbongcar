import chalk from "chalk";

export type LogLevel = "debug" | "info" | "warn" | "error";

const ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function envLevel(): LogLevel {
  const v = (process.env.LOG_LEVEL || "info").toLowerCase();
  if (v === "debug" || v === "info" || v === "warn" || v === "error") return v;
  return "info";
}

export class Logger {
  constructor(
    private readonly scope: string,
    private level: LogLevel = envLevel(),
  ) {}

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  child(scope: string): Logger {
    return new Logger(`${this.scope}:${scope}`, this.level);
  }

  private should(level: LogLevel): boolean {
    return ORDER[level] >= ORDER[this.level];
  }

  debug(msg: string, meta?: unknown): void {
    if (!this.should("debug")) return;
    const line = chalk.gray(`[DEBUG] [${this.scope}] ${msg}`);
    if (meta !== undefined) console.error(line, meta);
    else console.error(line);
  }

  info(msg: string): void {
    if (!this.should("info")) return;
    console.error(chalk.cyan(`[INFO]  [${this.scope}] ${msg}`));
  }

  warn(msg: string): void {
    if (!this.should("warn")) return;
    console.error(chalk.yellow(`[WARN]  [${this.scope}] ${msg}`));
  }

  error(msg: string, err?: unknown): void {
    if (!this.should("error")) return;
    console.error(chalk.red(`[ERROR] [${this.scope}] ${msg}`));
    if (err !== undefined) console.error(err);
  }
}

export const rootLogger = new Logger("oem-scraper");
