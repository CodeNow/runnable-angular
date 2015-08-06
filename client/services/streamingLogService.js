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

    var refreshAngular = debounce(function () {
      $rootScope.$applyAsync();
    }, 100);

    var streamLogs = [];
    var currentCommand = null;
    function handleStreamData (data) {
      if (data.type === 'command') {
        currentCommand = {
          content: [],
          command: $sce.trustAsHtml(convert.toHtml(data.content)),
          imageId: data.imageId
        };
        streamLogs.push(currentCommand);
      } else if (data.type === 'log'){
        currentCommand.content.push($sce.trustAsHtml(convert.toHtml(data.content)));
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