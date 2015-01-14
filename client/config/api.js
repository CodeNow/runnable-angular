'use strict';

var config = require('./json/api');
if (process.env.API_HOST) {
  config.host = process.env.API_HOST;
}
Object.freeze(config);
module.exports = config;
