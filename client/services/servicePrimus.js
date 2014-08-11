var PrimusClient = require('primus-client');
var util = require('util');

function RunnablePrimus () {
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
  var buildStream = this.substream(contextVersionId);
  this.write({
    id: 1,
    event: 'build-stream',
    data: {
      id: contextVersionId,
      build: build.json(),
      streamId: contextVersionId
    }
  });
  return buildStream;
};

RunnablePrimus.prototype.createTermStreams = function (container) {
  container = container.json ? container.json() : container;
  var streamId = container._id;
  var uniqueId = makeUniqueId(streamId);
  this.write({
    id: 1,
    event: 'terminal-stream',
    data: {
      dockHost: container.dockerHost,
      type: 'filibuster',
      containerId: container.dockerContainer,
      terminalStreamId: uniqueId,
      eventStreamId: uniqueId
    }
  });
  return {
    termStream: this.substream(uniqueId),
    eventStream: this.substream(uniqueId + 'events')
  };
};

RunnablePrimus.prototype.onBuildCompletedEvents = function (cb) {
  if (!cb) { throw new Error('cb is required'); }
  this.on('data', function (data) {
    if (data && data.event === 'BUILD_STREAM_ENDED') {
      cb(data.data.build);
    }
  });
};

require('app')
  .factory('primus', primus);

/**
 * @ngInject
 */
function primus(
  apiConfigHost
) {

    var url = apiConfigHost;

    var conn = new RunnablePrimus(url);

    conn.on('data', function (data) {
      if (data.error) {
        throw data.error;
      }
    });

    return conn;
}

function makeUniqueId(streamId) {
  return streamId + Math.floor(Math.random() * (100000000));
}
