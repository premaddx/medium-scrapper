const nconf = require('nconf');
const fs = require('fs');
const path = require('path');
const defaultConfig = require('../env/default.json');

/**
 * Initialize Configurations
 */
function init() {
  /**
   * Loading config from environment
   */
  nconf.env();

  /**
   * Verify Config file exist
   */
  const configFilePath = path.join(__dirname, '../env', `${process.env.NODE_ENV}.json`);
  try {
    fs.accessSync(configFilePath, fs.F_OK);
  } catch (err) {
    logger.info('Configuration file does not exist for current environment');
    process.exit(1);
  }

  /**
   * Loading default and environment specific config
   */
  nconf
    .file({ file: configFilePath })
    .defaults(defaultConfig);
}

module.exports = { init };