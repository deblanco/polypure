/**
 * Browser-compatible logger stub.
 * Logs to console instead of using winston.
 */

const LOG_LEVEL = (typeof process !== "undefined" && process.env?.LOG_LEVEL) || "debug";

const levels: Record<string, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = levels[LOG_LEVEL] ?? 3;

function shouldLog(level: string): boolean {
  return (levels[level] ?? 3) <= currentLevel;
}

export const logger = {
  debug: (message: string, meta?: any) => {
    if (shouldLog("debug")) {
      console.debug(JSON.stringify({ level: "debug", message, ...meta, timestamp: new Date().toISOString() }));
    }
  },
  info: (message: string, meta?: any) => {
    if (shouldLog("info")) {
      console.info(JSON.stringify({ level: "info", message, ...meta, timestamp: new Date().toISOString() }));
    }
  },
  warn: (message: string, meta?: any) => {
    if (shouldLog("warn")) {
      console.warn(JSON.stringify({ level: "warn", message, ...meta, timestamp: new Date().toISOString() }));
    }
  },
  error: (message: string, error?: Error | any) => {
    const errorMeta = error instanceof Error
      ? { error_message: error.message, stack: error.stack }
      : error;
    console.error(JSON.stringify({ level: "error", message, ...errorMeta, timestamp: new Date().toISOString() }));
  },
};

export const log = logger;

export default logger;

export type Logger = typeof logger;
