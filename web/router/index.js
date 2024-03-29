const router = require('express').Router();

require('./api/records')(router);

/**
 * Mounting respective paths.
 * @param {object} app Express instance
 */

module.exports = function (app) {
  app.use('/api/v1', router);
};
