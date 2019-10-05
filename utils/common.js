const urlParse = require('url-parse');
const mongoose = require('mongoose');
const Boom = require('boom');

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

function isHexString(str) {
  const hex = /[0-9A-Fa-f]{6}/g;
  if (hex.test(str)) return str;
  throw Boom.badRequest('Not a valid string');
}

function toObjectId(arg) {
  if (arg.constructor === Array) {
    return arg.map((val) => {
      return new mongoose.Types.ObjectId(isHexString(val));
    });
  }
  return new mongoose.Types.ObjectId(isHexString(arg));
}

module.exports = (obj) => {
  obj.getErrorMessages = getErrorMessages;
  obj.parseUrl = parseUrl;
  obj.toObjectId = toObjectId;
};
