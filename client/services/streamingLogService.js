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
      if (['docker', 'log'].indexOf(data.type) !== -1) {
        if (/^Step [0-9]+ : /.test(data.content)) {
          currentCommand = {
            content: [],
            command: $sce.trustAsHtml(convert.toHtml(data.content)),
            imageId: data.imageId,
            expanded: true
          };
          var previous = streamLogs[streamLogs.length - 1];
          if (previous) {
            previous.expanded = false;
          }
          streamLogs.push(currentCommand);
        } else {
          if (currentCommand) {
            if ($rootScope.featureFlags.debugMode && /^\s---> [a-z0-9]{12}/.test(data.content)) {
              currentCommand.imageId = data.content.replace('---> ', '');
            }

            currentCommand.content.push(data.content);

            if (unprocessed.indexOf(currentCommand)) {
              unprocessed.push(currentCommand);
            }
          }
        }
      }
      refreshAngular();
    }

    stream.on('data', handleStreamData);
    stream.on('end', function () {
      stream.off('data', handleStreamData);
    });

    return {
      logs: streamLogs,
      destroy: function(){
        stream.off('data', handleStreamData);
      }
    };
  };
}