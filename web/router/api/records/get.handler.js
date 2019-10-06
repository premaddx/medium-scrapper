const { urlStoreDAO } = rootRequire('dao');

async function logic() {
  try {
    const result = await urlStoreDAO.find({
      baseQuery: {},
      selectQuery: { url: 1, count: 1, params: 1, _id: 0 },
      sortQuery: { count: -1 },
    });
    return result;
  } catch (e) {
    throw e;
  }
}

function handler(req, res, next) {
  logic()
    .then((data) => {
      res.json(data);
    })
    .catch(err => next(err));
}
module.exports = handler;
