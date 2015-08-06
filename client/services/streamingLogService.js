'use strict';

var Convert = require('ansi-to-html');
var convert = new Convert();

require('app').factory('streamingLog', streamingLog);

function streamingLog (
  $rootScope,
  debounce,
  $sce
) {
  return function (stream) {

    var unprocessed = [];

    var refreshAngular = debounce(function () {
      unprocessed.forEach(function (unprocessed) {
        unprocessed.trustedContent = $sce.trustAsHtml(convert.toHtml(unprocessed.content.join('')));
      });
      unprocessed = [];
      $rootScope.$applyAsync();
    }, 100);

    var streamLogs = [];
    var currentCommand = null;
    function handleStreamData (data) {
      if (data.type === 'command') {

        currentCommand = {
          content: [],
          command: $sce.trustAsHtml(convert.toHtml(data.content)),
          imageId: data.imageId,
          expanded: true
        };
        var previous = streamLogs[streamLogs.length-1];
        if (previous) {
          previous.expanded = false;
        }
        streamLogs.push(currentCommand);
      } else if (data.type === 'log'){
        if (unprocessed.indexOf(currentCommand)) {
          unprocessed.push(currentCommand);
        }
        currentCommand.content.push(data.content + '\n');
      }
      refreshAngular();
    }

    stream.on('data', handleStreamData);

    return {
      logs: streamLogs,
      destroy: function(){
        stream.off('data', handleStreamData);
      }
    };
  };
}