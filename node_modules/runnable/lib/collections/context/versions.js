'use strict';

var Base = require('../base');
var util = require('util');
module.exports = Versions;

function Versions () {
  Base.apply(this, arguments);
}

util.inherits(Versions, Base);

Versions.prototype.urlPath = 'versions';

Versions.prototype.Model = require('../../models/context/version');
