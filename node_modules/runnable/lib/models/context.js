'use strict';

var util = require('util');
var Base = require('./base');

module.exports = Context;

function Context () {
  return Base.apply(this, arguments);
}

util.inherits(Context, Base);

require('../extend-with-factories')(Context);

Context.prototype.urlPath = 'contexts';
