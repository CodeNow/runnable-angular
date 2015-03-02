'use strict';

var EventEmitter = require('events').EventEmitter;


/**
 * Mock Build Log Stream
 */
function MockReadWriteStream() {}
require('util').inherits(MockReadWriteStream, EventEmitter);

MockReadWriteStream.prototype._read = function () {
  var self = this;
  setTimeout(function () {
    var str = 'build logs\r\n';
    var buf = new Buffer(str);
    self.push(buf);
  }, 50);
};
MockReadWriteStream.prototype.off = function () {
  this.removeListener.apply(this, arguments);
};
//
MockReadWriteStream.prototype.write = function (msg, cb) {
  this.emit('data', msg);
  if (cb) {
    cb();
  }
};

MockReadWriteStream.prototype.end = function (msg, cb) {
  this.emit('end', msg);
  if (cb) {
    cb();
  }
};
/**
 * Mock Primus
 */
function MockPrimus () {
  EventEmitter.apply(this, arguments);
}
require('util').inherits(MockPrimus, EventEmitter);
MockPrimus.prototype.createLogStream = function () {
  return new MockReadWriteStream();
};
MockPrimus.prototype.createBuildStream = function () {
  return new MockReadWriteStream();
};
MockPrimus.prototype.off = function () {
  this.removeListener.apply(this, arguments);
};

module.exports = MockPrimus;
