process.env.NODE_PATH="./lib";
process.env.NODE_ENV="test";

var Api = require('api-server/lib/index');
var api = new Api();
api.start(function () {});