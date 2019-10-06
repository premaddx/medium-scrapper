const getHandler = require('./get.handler');

module.exports = router => {
  router.get('/record', getHandler);
};
