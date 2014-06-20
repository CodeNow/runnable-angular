'use strict';

var Base = require('./base');
var util = require('util');
module.exports = Users;

function Users () {
  Base.apply(this, arguments);
}

util.inherits(Users, Base);

setTimeout(function () {
  Users.prototype.Model = require('../models/user');
}, 0);