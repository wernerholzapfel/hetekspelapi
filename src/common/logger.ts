import { join } from 'path';
import { createLogger, format, transports } from 'winston';
import { formatDate } from './dates';

const formatArr = [
  format.timestamp(),
  format.printf(log => {
    return `${log.level} | ${formatDate(log.timestamp)} | ${log.message}`;
  }),
];

const options = {
  file: {
    level: 'info',
    filename: join(process.cwd(), 'logs', 'app.log'),
    handleExceptions: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false,
    format: format.combine(...formatArr),
  },
  console: {
    levels: ['info', 'debug'],
    handleExceptions: true,
    json: false,
    colorize: true,
    format: format.combine(format.colorize(), ...formatArr),
  },
};

const logger = createLogger({
  transports: [
    new transports.File(options.file),
    new transports.Console(options.console),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

logger.stream = {
// @ts-ignore
  write: (message, encoding) => logger.info(message),
};

export default logger;
