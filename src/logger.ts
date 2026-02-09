import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

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

// File transport for error logs (always errors)
const errorFileTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  format: jsonFormat,
  maxSize: '20m',
  maxFiles: '14d',
});

// File transport for all logs
const combinedFileTransport = new DailyRotateFile({
  filename: 'logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: LOG_LEVEL,
  format: jsonFormat,
  maxSize: '20m',
  maxFiles: '14d',
});

// Create logger instance
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: jsonFormat,
  transports: [
    consoleTransport,
    errorFileTransport,
    combinedFileTransport,
  ],
  exitOnError: false, // Don't exit on exceptions, let us handle them
  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' }),
  ],
});

// Ensure logs are flushed on process exit
const flushLogs = () => {
  logger.flush();
};

// Hook into process exit to flush logs
process.on('exit', flushLogs);
process.on('SIGINT', () => {
  flushLogs();
  process.exit(0);
});
process.on('SIGTERM', () => {
  flushLogs();
  process.exit(0);
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
