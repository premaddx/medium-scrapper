const getHandler = require('./get.handler');

module.exports = router => {
  /*
   * @api [get] /record
   * description: "Fetches the count and distinct params of each url"
   * parameters:
   * responses:
   *   200:
   *     description: success: Boolean, data: Array of objects
   *      Data contains the count and distinct params of each url
   */
  router.get('/record', getHandler);
};
