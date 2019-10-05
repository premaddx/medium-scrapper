const request = require('request');

const { BASEURL } = rootRequire('constants');

function makeBaseUrlRequest() {
  return new Promise((resolve, reject) => {
    request(BASEURL, (err, resp, html) => {
      if (err) return reject(err);
      return resolve(html);
    });
  });
}


function makeRequest(url, successCallback, errorCallback) {
  return (key) => new Promise((resolve, reject) => {
    request(url, (err, resp, html) => {
      logger.info(`Fetching for process - ${key}`);
      if (err) return reject(errorCallback(err, key));
      return resolve(successCallback(html, key));
    });
  });
}

module.exports = {
  makeRequest,
  makeBaseUrlRequest,
};
