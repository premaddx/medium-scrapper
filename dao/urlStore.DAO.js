const MODEL = rootRequire('models').UrlStore;
const DAO = require('./DAO'); // return constructor function.

function UrlStoreDAO() {
  this.Model = MODEL;
}

// Prototypal Inheritance
UrlStoreDAO.prototype = new DAO();

module.exports = function () {
  return new UrlStoreDAO();
};
