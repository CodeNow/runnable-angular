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


var userData = {};
RunnablePrimus.prototype.createUserStream = function(userId) {
  // We are only subscribed to one user stream at a time
  if (userData.streamId) {
    this.write({
      id: userData.streamId,
      event: 'subscribe',
      data: {
        action: 'leave',
        type: 'org',
        name: userData.userId
      }
    });
  }
  userData.streamId = makeUniqueId(userId);
  userData.userId = userId;
  this.write({
    id: userData.streamId,
    event: 'subscribe',
    data: {
      action: 'join',
      type: 'org',
      name: userData.userId
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
  $rootScope,
  configAPIHost
) {
  // TODO: make idempotent
  var url = configAPIHost;
  var conn = new RunnablePrimus(url);

  /**
   * TODO: script load timing
  var connStartTime = new Date();
  if ($window.NREUM) {
    conn.on('open', function () {
      var delay = new Date().getTime() - connStartTime.getTime();
      if (!$window.NREUM) {
        $window.NREUM.inlineHit('primus-connection-open', 0, delay);
      }
    });
  }
  */

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
