const mongoose = require('mongoose');
const bluebird = require('bluebird');

mongoose.Promise = bluebird;

const Schema = mongoose.Schema;

// compile models here

const User = mongoose.model('User', require('./user.schema')(Schema));

module.exports = {
  User,
};