const winston = require('winston');
function createNewLogger(loggerName="None") {
  const logger = new (winston.Logger)({
    transports: [
      new (winston.transports.Console)({
        colorize: true,
        timestamp: true,
        label: loggerName,
      }),
      new (winston.transports.File)({
        filename: 'combined.log',
      })
    ],
  });
  
  if (process.env.NODE_ENV !== 'production') {
    logger.level = 'debug';
  } else {
    logger.level = 'info';
  };

  return logger;
};
module.exports = createNewLogger;
