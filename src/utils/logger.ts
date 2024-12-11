import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = winston.createLogger({
    format: winston.format.combine(winston.format.timestamp(), logFormat),
    transports: [
        // Info level logging
        new DailyRotateFile({
            filename: 'logs/%DATE%-info.log',
            datePattern: 'YYYY-MM-DD',
            level: 'info',
            handleExceptions: true,
            zippedArchive: true,
            maxSize: '20m',
        }),
        // Warning level logging
        new DailyRotateFile({
            filename: 'logs/%DATE%-warn.log',
            datePattern: 'YYYY-MM-DD',
            level: 'warn',
            handleExceptions: true,
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
        }),
        // Error level logging
        new DailyRotateFile({
            filename: 'logs/%DATE%-error.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            handleExceptions: true,
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
        }),
    ],
});

// Console logging for non-production environments
if (process.env.NODE_ENV !== 'production') {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
        })
    );
}

export default logger;
