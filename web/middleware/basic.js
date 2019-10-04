const bodyParser = require('body-parser');
const morgan = require('morgan');
const cors = require('cors');

function basicMiddlewares(app) {
  // throws 400 error to next, if JSON is not valid
  app.use(bodyParser.json({
    limit: '50mb',
    strict: true,
  }));

  // parses the url encoded strings
  app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true,
  }));

  // logs incoming request in dev pattern
  // app.use(morgan('dev'));
  app.use(morgan(':method :status :res[content-length] - :response-time ms', { stream: logger.stream }));
  // CORS enabled
  app.use(cors());

  // app.use(function (req, res, next) {
  //   res.header("Access-Control-Allow-Origin", "*");
  //   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  //   next();
  // });

  // for detecting sql injections
  // app.use(sqlinjection);
}

module.exports = basicMiddlewares;
