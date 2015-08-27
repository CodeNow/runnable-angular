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
        var stepRegex = /^Step [0-9]+ : /;
        if (stepRegex.test(data.content)) {
          currentCommand = {
            content: [],
            command: $sce.trustAsHtml(convert.toHtml(data.content.replace(stepRegex, ''))),
            imageId: data.imageId,
            expanded: true
          };
          var previous = streamLogs[streamLogs.length - 1];
          if (previous) {
            previous.expanded = false;
          }
          streamLogs.push(currentCommand);
        } else if (currentCommand) {

          if (/^\s---> Using cache/.test(data.content)){
            currentCommand.cached = true;
          } else if ($rootScope.featureFlags.debugMode && /^\s---> (Running in )?[a-z0-9]{12}/.test(data.content)) {
            currentCommand.imageId = data.content.replace('---> ', '');
          } else {
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