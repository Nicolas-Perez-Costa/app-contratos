const winston = require('winston');

const env = process.env.NODE_ENV || 'development';
const isDevelopment = env !== 'production';

const level = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

winston.addColors(colors);

const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    isDevelopment
        ? winston.format.colorize({ all: true })
        : winston.format.uncolorize(),
    isDevelopment
        ? winston.format.printf(
            (info) => `${info.timestamp} ${info.level}: ${info.message}` + 
                      (info.metadata && Object.keys(info.metadata).length ? ` ${JSON.stringify(info.metadata)}` : '') +
                      (info.stack ? `\n${info.stack}` : '')
          )
        : winston.format.json()
);

const logger = winston.createLogger({
    level,
    levels: winston.config.npm.levels,
    format,
    transports: [
        new winston.transports.Console()
    ],
});

// Create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
    write: (message) => logger.info(message.trim()),
};

module.exports = logger;
