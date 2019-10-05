const mongoose = require('mongoose');
const databaseConfig = require('./database');

async function init(cb) {
  const options = {
    socketTimeoutMS: 0,
    reconnectTries: 30,
    keepAlive: 300000,
    connectTimeoutMS: 30000,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  };

  const connectionString = databaseConfig().connectionString;

  mongoose.connect(connectionString, options);

  mongoose.connection.on('connected', () => {
    logger.info(`Mongoose default connection open to ${databaseConfig().dbURI} / ${databaseConfig().db}`);
    cb();
  });

  // If the connection throws an error
  mongoose.connection.on('error', (err) => {
    logger.error(`Mongoose default connection error: ${err}`);
    throw err;
  });

  // When the connection is disconnected
  mongoose.connection.on('disconnected', () => {
    logger.info('Mongoose default connection disconnected');
  });
  // LOADING MODELS
}

module.exports = { init };
