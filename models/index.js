const mongoose = require('mongoose');
const bluebird = require('bluebird');

mongoose.Promise = bluebird;

const Schema = mongoose.Schema;

// compile models here

const UrlStore = mongoose.model('UrlStore', require('./urlStore.schema')(Schema));

module.exports = {
  UrlStore,
};
