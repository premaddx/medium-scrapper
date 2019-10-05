const assert = require('assert');

let Schema = null;

function init() {
  const ObjectId = Schema.Types.ObjectId;
  const urlStoreSchema = new Schema({
    url_id: { type: ObjectId },
    // href: String,
    url: { type: String, unique: true },
    origin: String,
    pathname: String,
    count: Number,
    params: Array,
    status: String,
  }, {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  });

  return urlStoreSchema;
}

module.exports = (schema) => {
  assert.ok(schema);
  Schema = schema;
  return init();
};
