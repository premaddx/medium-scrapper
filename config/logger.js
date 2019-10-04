const winston = require('winston');

winston.emitErrs = true;
const logger = new winston.Logger({
  transports: [
    /** File transport can also be added */
    new winston.transports.Console({
      timestamp: function () {
        return (new Date());
      },
      formatter: function (options) {
        const meta = (options.meta && Object.keys(options.meta).length ? `\n\t ${JSON.stringify(options.meta)}` : '');
        return `${options.timestamp()} ${options.level.toUpperCase()} ${options.message} ${meta}`;
      },
      level: process.env.LOGGER_LEVEL || 'info',
      handleExceptions: false,
      json: false,
      colorize: true,
    }),
  ],
  exitOnError: false,
});

module.exports = logger;

module.exports.stream = {
  write: function (message) {
    logger.info(message);
  },
};