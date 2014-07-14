var nock = require('nock');

var user = require('./user');
var t = user.auth200;

var user = nock('http://localhost:3002')[t.method](t.path)
  .reply(t.responseCode, t.responseData);
