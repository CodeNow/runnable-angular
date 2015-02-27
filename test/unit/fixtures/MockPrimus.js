'use strict';

var ReadableStream = require('stream').Readable;
var EventEmitter = require('events').EventEmitter;

/**
 * Mock Box Log Stream
 */
function MockBoxLogStream () {
  ReadableStream.apply(this, arguments);
}
require('util').inherits(MockBoxLogStream, ReadableStream);
MockBoxLogStream.prototype._read = function () {
  var self = this;
  setTimeout(function () {
    var str = 'box logs\r\n';
    var buf = new Buffer(str);
    self.push(buf);
  }, 50);
};
MockBoxLogStream.prototype.off = function () {
  this.removeListener.apply(this, arguments);
};

/**
 * Mock Build Log Stream
 */
function MockBuildLogStream () {
  ReadableStream.apply(this, arguments);
}
require('util').inherits(MockBuildLogStream, ReadableStream);
MockBuildLogStream.prototype._read = function () {
  var self = this;
  setTimeout(function () {
    var str = 'build logs\r\n';
    var buf = new Buffer(str);
    self.push(buf);
  }, 50);
};
MockBuildLogStream.prototype.off = function () {
  this.removeListener.apply(this, arguments);
};

/**
 * Mock Primus
 */
function MockPrimus () {
  EventEmitter.apply(this, arguments);
}
require('util').inherits(MockPrimus, EventEmitter);
MockPrimus.prototype.createLogStream = function () {
  return new MockBoxLogStream();
};
MockPrimus.prototype.createBuildStream = function () {
  return new MockBuildLogStream();
};
MockPrimus.prototype.off = function () {
  this.removeListener.apply(this, arguments);
};

module.exports = {
  primus: MockPrimus,
  stream: MockBuildLogStream
};
