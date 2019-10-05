const urlParse = require('url-parse');

function getErrorMessages(error) {
  if (error.details && error.details.length > 0) {
    return error.details.reduce((acc, v) => {
      acc.push(v.message);
      return acc;
    }, []).join('\n');
  }
  return error.message;
}

function parseUrl(url = '') {
  return urlParse(url, true);
}

module.exports = (obj) => {
  obj.getErrorMessages = getErrorMessages;
  obj.parseUrl = parseUrl;
};
