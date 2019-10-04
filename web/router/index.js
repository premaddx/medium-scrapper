const router = require('express').Router();
/**
 * Mounting respective paths.
 * @param {object} app Express instance
 */

require('./api/test')(router);

module.exports = function (app) {
  app.use('/api/v1', router);
};
