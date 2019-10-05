// Starting an API Server to expose functinalities
const { express } = rootRequire('config');
const app = express();

const config = require('nconf');
const appServer = require('http').Server(app);

// mounting middlewares
const { basic, handleError } = require('./middleware');
const router = require('./router');
const initScrapper = require('../workers/scrapper');

function init() {
  basic(app);

  // mounting routes
  router(app);

  handleError(app);

  appServer.listen(config.get('PORT'), (err) => {
    if (err) {
      logger.error(`Error while starting server at port ${config.get('PORT')} | Error: ${err.message}`);
    }
    logger.info(`Environment: ${config.get('NODE_ENV')}`);
    logger.info(`Express Server Up and Running @PORT: ${config.get('PORT')} | at localhost`);
    // initialize a scrapper
    initScrapper();
  });
}


module.exports = { init, appServer };
