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
    var streamTimes = {};
    var timingInterval = null;
    function handleStreamData (data) {
      if (['docker', 'log'].includes(data.type)) {
        var stepRegex = /^Step [0-9]+ : /;
        if (stepRegex.test(data.content)) {
          currentCommand = {
            content: [],
            command: $sce.trustAsHtml(convert.toHtml(data.content.replace(stepRegex, ''))),
            imageId: data.imageId,
            expanded: true,
            time: new Date(data.timestamp || new Date())
          };
          var previous = streamLogs[streamLogs.length - 1];
          if (previous) {
            previous.expanded = false;
          }
          streamLogs.push(currentCommand);
        } else if (currentCommand) {


          var ignoreRegex = [
            /^Runnable: Build completed successfully!/,
            /^\s---> Running in [a-z0-9]{12}/,
            /^Successfully built [a-z0-9]{12}/
          ];

          var ignore = ignoreRegex.some(function (regex){
            return regex.test(data.content);
          });

          if (!ignore) {
            if (/^\s---> Using cache/.test(data.content)){
              currentCommand.cached = true;
            } else if ($rootScope.featureFlags.debugMode && /^\s---> ?[a-z0-9]{12}/.test(data.content)) {
              currentCommand.imageId = /^\s---> (Running in )?([a-z0-9]{12})/.exec(data.content)[2];
            } else {
              currentCommand.content.push(data.content);
              if (unprocessed.indexOf(currentCommand)) {
                unprocessed.push(currentCommand);
              }
            }
          }
        }
      }

      if (data.timestamp) {
        streamTimes.latest = new Date(data.timestamp);
        clearInterval(timingInterval);
        streamTimes.currentMachineTime = streamTimes.latest;
        timingInterval = setInterval(function () {
          streamTimes.currentMachineTime = new Date(streamTimes.currentMachineTime.getTime() + 1000);
        }, 1000);
        if(!streamTimes.start){
          streamTimes.start = new Date(data.timestamp);
        }
      }
      refreshAngular();
    }

    stream.on('data', handleStreamData);
    stream.on('end', function () {
      clearInterval(timingInterval);
      streamTimes.end = streamTimes.latest;
      stream.off('data', handleStreamData);
    });

    return {
      logs: streamLogs,
      times: streamTimes,
      destroy: function(){
        stream.off('data', handleStreamData);
      }
    };
  };
}

