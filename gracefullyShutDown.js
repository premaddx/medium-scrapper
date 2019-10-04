const mongoose = require('mongoose');
// Gracefull shutdown, preventing data loss.
// i.e. wait for existing connections and processes
module.exports = function (appServer) {
  const gracefulShutdown = function (err) {
    const timestamp = Date.now();
    if (err) {
      logger.info(`ProcessId: ${timestamp} uncaughtException: ${err.message}`);
      logger.info(`ProcessId: ${timestamp} Shutting down gracefully.`);

      logger.error(`ProcessId: ${timestamp} uncaughtException: ${err.message}`);
      logger.error(`ProcessId: ${timestamp}`, err.stack);
    } else {
      logger.info(`ProcessId: ${timestamp} Received kill signal, shutting down gracefully.`);
    }

    mongoose.connection.close(() => {
      logger.info('Mongoose default connection disconnected through app termination');
    });
    // stop reciving connections.
    appServer.close(() => {
      logger.info(`Closed out remaining connections. ProcessId: ${timestamp}`);
      if (err) {
        logger.info('Shutting Down Forcefully');
        setTimeout(() => {
          process.exit(1);
        }, 6 * 1000);
      } else {
        logger.info('Shutting Down');
        process.exit(0);
      }
    });

    // Wait for 20 second to close all open connections and processes before hard shutdown
    setTimeout(() => {
      logger.error(`Could not close connections in time, forcefully shutting down. ProcessId: ${timestamp}`);
      logger.info('Shutting Down Forcefully');
      process.exit(1);
    }, 20 * 1000);
  };

  // listen for TERM signal .e.g. kill
  process.on('SIGTERM', gracefulShutdown);

  // listen for INT signal e.g. Ctrl-C
  process.on('SIGINT', gracefulShutdown);

  // uncaughtException Exception
  process.on('uncaughtException', gracefulShutdown);
};