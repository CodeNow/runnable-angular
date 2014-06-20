'use strict';

var Users = require('./users');
var util = require('util');
module.exports = Groups;

function Groups () {
  Users.apply(this, arguments);
}

util.inherits(Groups, Users);

Groups.prototype.urlPath = 'groups';

Groups.prototype.Model = require('../models/group');
