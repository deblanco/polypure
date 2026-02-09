import winston from 'winston';

// Get log level from environment, default to debug
const LOG_LEVEL = process.env.LOG_LEVEL || 'debug';

// JSON format for all console logs
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console transport with JSON format
const consoleTransport = new winston.transports.Console({
  format: jsonFormat,
  level: 'debug',
});

// Create logger instance (console only, no file logging)
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: jsonFormat,
  transports: [
    consoleTransport,
  ],
});

// Convenience methods with consistent signature
export const log = {
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  error: (message: string, error?: Error | any) => {
    // Errors are always printed
    const errorMeta = error instanceof Error
      ? { message: error.message, stack: error.stack, ...error }
      : error;
    logger.error(message, errorMeta);
  },
};

// Export winston logger for advanced usage
export default logger;
