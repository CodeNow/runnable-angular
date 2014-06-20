'use strict';

var util = require('util');
var isFunction = require('101/is-function');
var User = require('./user');
var Base = require('./base');

module.exports = Group;

function Group () {
  return Base.apply(this, arguments);
}

util.inherits(Group, User);

require('../extend-with-factories')(Group);

Group.prototype.urlPath = 'groups';

Group.prototype.createProject = function (opts, cb) {
  if (isFunction (opts)) {
    cb = opts;
    opts = null;
  }
  opts = opts || {};
  opts.json = opts.json || {};
  if (!this.id()) {
    throw new Error('Owner id is required');
  }
  opts.json.owner = this.id();
  return User.prototype.createProject.call(this, opts, cb);
};

Group.prototype.addMemberById = function (userId, cb) {
  var users = this.attrs.groupMembers;
  if (users.indexOf(userId) === -1) {
    users.push(userId);
    this.update({ json: { groupMembers: users }}, cb);
  } else {
    cb(null, this.toJSON());
  }
};

Group.prototype.addOwnerById = function (userId, cb) {
  var users = this.attrs.groupOwners;
  if (users.indexOf(userId) === -1) {
    users.push(userId);
    this.update({ json: { groupOwners: users }}, cb);
  } else {
    cb(null, this.toJSON());
  }
};

Group.prototype.removeMemberById = function (userId, cb) {
  var users = this.attrs.groupMembers;
  var index = users.indexOf(userId);
  if (index !== -1) {
    users.splice(index, 1);
    this.update({ json: { groupMembers: users }}, cb);
  } else {
    cb(null, this.toJSON());
  }
};

Group.prototype.removeOwnerById = function (userId, cb) {
  var users = this.attrs.groupOwners;
  var index = users.indexOf(userId);
  if (index !== -1) {
    users.splice(index, 1);
    this.update({ json: { groupOwners: users }}, cb);
  } else {
    cb(null, this.toJSON());
  }
};
