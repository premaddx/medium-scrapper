const Joi = require('joi');
const config = require('nconf');
const { VALID_DB } = require('../constants');

module.exports = () => {
  const DB = config.get('DB');
  const DB_URI = config.get('DB_URI');

  const dbConfigSchema = Joi.object({ DB: Joi.string().valid(VALID_DB).required(), DB_URI: Joi.string().required() })
    .unknown()
    .required();

  const { error } = Joi.validate({
    DB,
    DB_URI,
  }, dbConfigSchema);

  if (error) {
    logger.error(`Config Validation error : ${error.message} : ${error.stack}`);
    throw new Error(`Config validation error: ${error.message}`);
  }

  return {
    db: config.get('DB'),
    dbURI: config.get('DB_URI'),
    connectionString: `mongodb://${DB_URI}/${DB}`,
  };
};
