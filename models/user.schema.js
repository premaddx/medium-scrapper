const assert = require('assert');

let Schema = null;

function init() {
  const ObjectId = Schema.Types.ObjectId;
  const userSchema = new Schema({
    user_id: { type: ObjectId },
    email: { type: String, unique: true },
    password: String,
  });

  return userSchema;
}

module.exports = (schema) => {
  assert.ok(schema);
  Schema = schema;
  return init();
};
