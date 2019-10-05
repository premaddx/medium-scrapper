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
  return (url) => {
    request(url, (err, resp, html) => {
      logger.info(`Fetching for process - ${url}`);
      if (err) return errorCallback(err, url);
      return successCallback(html, url);
    });
  };
}

module.exports = {
  makeRequest,
  makeBaseUrlRequest,
};
