const assert = require('assert');

let Schema = null;

function init() {
  const urlStoreSchema = new Schema({
    url: String,
    origin: String,
    pathname: String,
    href: { type: String, unique: true },
    count: Number,
    params: Array,
  });

  return urlStoreSchema;
}

module.exports = (schema) => {
  assert.ok(schema);
  Schema = schema;
  return init();
};
