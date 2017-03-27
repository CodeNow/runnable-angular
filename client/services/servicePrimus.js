'use strict';

var PrimusClient = require('primus-client');
var util = require('util');
var keypather = require('keypather')();
// FIXME: should be injected
var uuid = require('node-uuid');

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

RunnablePrimus.prototype.createBuildStreamFromContainerId = function (contextVersionId, containerId) {
  var uniqueId = makeUniqueId(contextVersionId);
  var buildStream = this.substream(uniqueId);
  var self = this;

  setTimeout(function () {
    // If in room, don't send
    self.write({
      id: 1,
      event: 'build-stream',
      data: {
        id: contextVersionId,
        containerId: containerId,
        streamId: uniqueId
      }
    });
  }, 10);
  return buildStream;
};

RunnablePrimus.prototype.createBuildStream = function (build) {
  var containerId = keypather.get(build, 'contextVersions.models[0].attrs.build.dockerContainer');
  var contextVersionId = keypather.get(build, 'contextVersions.models[0].id()');
  if (containerId) {
    return this.createBuildStreamFromContainerId(contextVersionId, containerId);
  }
};

RunnablePrimus.prototype.createTermStreams = function (container, isDebugContainer, terminalId) {
  container = container.json ? container.json() : container;
  var streamId = container.dockerContainer;
  var uniqueId = makeUniqueId(streamId);
  this.write({
    id: 1,
    event: 'terminal-stream',
    data: {
      dockHost: container.dockerHost,
      type: 'filibuster',
      isDebugContainer: isDebugContainer,
      containerId: container.dockerContainer,
      terminalStreamId: uniqueId,
      eventStreamId: uniqueId + 'events',
      terminalId: terminalId
    }
  });
  return {
    termStream: this.substream(uniqueId),
    eventStream: this.substream(uniqueId + 'events'),
    uniqueId: uniqueId
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
    userData.onEnd();
  }
  userData.streamId = makeUniqueId(userId);
  userData.userId = userId;
  var message = {
    id: userData.streamId,
    event: 'subscribe',
    data: {
      action: 'join',
      type: 'org',
      name: userData.userId
    }
  };
  this.write(message);
  userData.onEnd = this.reconnectWhenNeeded(this, message);
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
  $interval,
  configAPISockHost
) {
  // TODO: make idempotent
  var url = configAPISockHost;
  var conn = new RunnablePrimus(url);
  conn.$interval = $interval;

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

RunnablePrimus.prototype.joinStreams = function (src, des) {
  src.on('data', function (data) {
    if (des.write) {
      des.write(data);
    }

  });
  src.on('end', function () {
    if (des.end) {
      des.end();
    }
  });
  return des;
};

RunnablePrimus.prototype.reconnectWhenNeeded = function (stream, socketConnectionMessage) {
  var self = this;

  var reconnecting = false;
  function onOpen() {
    if (reconnecting) {
      reconnecting = false;
      self.write(socketConnectionMessage);
    }
  }

  function onReconnecting() {
    reconnecting = true;
  }

  stream.on('reconnect', onReconnecting);
  stream.on('open', onOpen);
  var onEnd = function () {
    stream.off('open', onOpen);
    stream.off('reconnect', onReconnecting);
  };
  stream.on('end', onEnd);
  return onEnd;
};

function makeUniqueId(streamId) {
  return streamId + uuid();
}
