'use strict';

var PrimusClient = require('primus-client');
var util = require('util');
var uuid = require('uuid');

function RunnablePrimus() {
  PrimusClient.apply(this, arguments);
}

util.inherits(RunnablePrimus, PrimusClient);

RunnablePrimus.prototype.createLogStream = function (container) {
  var dockerContainerId = container.attrs.dockerContainer;
  var logStream = this.substream(dockerContainerId);
  this.write({
    id: 1,
    event: 'log-stream',
    data: {
      substreamId: dockerContainerId,
      dockHost: container.attrs.dockerHost,
      containerId: dockerContainerId
    }
  });
  return logStream;
};

RunnablePrimus.prototype.createBuildStream = function (build) {
  var contextVersionId = build.contextVersions.models[0].id();
  var uniqueId = makeUniqueId(contextVersionId);
  var buildStream = this.substream(uniqueId);

  // If in room, don't send
  this.write({
    id: 1,
    event: 'build-stream',
    data: {
      id: contextVersionId,
      streamId: uniqueId
    }
  });
  return buildStream;
};

RunnablePrimus.prototype.createTermStreams = function (container) {
  container = container.json ? container.json() : container;
  var streamId = container.dockerContainer;
  var uniqueId = makeUniqueId(streamId);
  this.write({
    id: 1,
    event: 'terminal-stream',
    data: {
      dockHost: container.dockerHost,
      type: 'filibuster',
      containerId: container.dockerContainer,
      terminalStreamId: uniqueId,
      eventStreamId: uniqueId + 'events'
    }
  });
  return {
    termStream: this.substream(uniqueId),
    eventStream: this.substream(uniqueId + 'events')
  };
};

RunnablePrimus.prototype.createUserStream = function(userId) {
  var uniqueId = makeUniqueId(userId);
  this.write({
    id: uniqueId,
    event: 'subscribe',
    data: {
      action: 'join',
      type: 'org',
      name: userId
    }
  });
  // Whatever creates the stream will need to filter it
  return this;
};

require('app')
  .factory('primus', primus);

/**
 * @ngInject
 */
function primus(
  $log,
  configAPIHost,
  $rootScope
) {

  var url = configAPIHost;

  var conn = new RunnablePrimus(url);

  conn.on('data', function (data) {
    if (data.error) {
      $log.warn(data.error);
    }
  });

  return conn;
}

function makeUniqueId(streamId) {
  return streamId + uuid();
}
