'use strict';

var Convert = require('ansi-to-html');
var clc = require('cli-color');
var convert = new Convert({
  escapeXML: true
});

require('app').factory('streamingLog', streamingLog);

function streamingLog(
  $rootScope,
  debounce,
  $sce,
  $interval
) {
  return function (stream) {
    var refreshAngular = debounce(function () {
      $rootScope.$applyAsync();
    }, 100, true);

    var checkExpandingInterval;
    var streamLogs = [];
    var currentCommand = null;
    var streamTimes = {};
    var timingInterval = null;
    var streaming = false;
    var rawLogs = [];
    var processedRawLogs = null;
    function handleStreamData(dataArray) {
      if (!Array.isArray(dataArray)) {
        dataArray = [dataArray];
      }
      dataArray.forEach(function (data) {
        if (['docker', 'log', 'error'].includes(data.type)) {
          var stepRegex = /^Step [0-9]+ : /;
          if (stepRegex.test(data.content)) {
            if (currentCommand) {
              currentCommand.expanded = false;
            }
            currentCommand = {
              unprocessedContent: [],
              command: $sce.trustAsHtml(convert.toHtml(data.content.replace(stepRegex, ''))),
              rawCommand: data.content.replace(stepRegex, ''),
              imageId: data.imageId,
              expanded: false,
              time: new Date(data.timestamp || new Date()),
              converter: new Convert({
                stream: true,
                escapeXML: true
              }),
              trustedContent: $sce.trustAsHtml(''),
              trustedLines: [],
              displayLines: [],
              hasContent: false,
              processHtml: debounce(function () {
                var self = this;
                if (!self.unprocessedContent.length) {
                  return;
                }
                var joinedContent = self.unprocessedContent.join('');
                var lastLineIsFinished = joinedContent.slice(-2) === '\n';
                var lines = joinedContent.split('\n');
                var oldProcessedLine = self.lastProcessedLine;
                self.lastProcessedLine = null;
                lines.forEach(function (line, index) {
                  if (line.length > 1000) {
                    line = line.substr(0, 1000) + ' - Line Truncated because its too long.';
                  }
                  // If we can still expect new logs, and the last line isn't finished and it's the last line let's temporarily process it.
                  if (streaming && currentCommand === self && !lastLineIsFinished && index === (lines.length - 1)) {
                    self.lastProcessedLine = self.converter.toHtml(line + '\n');
                  } else {
                    self.trustedLines.push($sce.trustAsHtml(self.converter.toHtml(line + '\n')));
                  }
                });
                // Short circuit. Don't make a new array since nothing has changed.
                if (oldProcessedLine === self.lastProcessedLine && self.lastProcessedLine) {
                  return;
                }
                self.unprocessedContent = [];
                self.lineCount = self.trustedLines.length;
                self.displayLines = [].concat(self.trustedLines);
                if (self.lastProcessedLine) {
                  self.displayLines.push($sce.trustAsHtml(self.lastProcessedLine));
                  self.unprocessedContent.push(lines[lines.length - 1]);
                }
              }, 10, true),
              getProcessedHtml: function () {
                this.processHtml();
                return this.displayLines;
              }
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

            var ignore = ignoreRegex.some(function (regex) {
              return regex.test(data.content);
            });

            if (!ignore) {
              if (/^\s---> Using cache/.test(data.content)) {
                currentCommand.cached = true;
              } else if (/^\s---> [a-z0-9]{12}/.test(data.content)) {
                currentCommand.imageId = /^\s---> ([a-z0-9]{12})/.exec(data.content)[1];
              } else if (data.type === 'error') {
                // Only include error logs if there's no previous log for this command
                if (!currentCommand.hasContent) {
                  currentCommand.hasContent = true;
                  currentCommand.unprocessedContent.push(clc.red(data.content));
                }
              } else {
                currentCommand.hasContent = true;
                currentCommand.unprocessedContent.push(data.content);
              }
            }
          }
        }
        if (data.content) {
          rawLogs.push(data);
          processedRawLogs = null;
        }

        // Only start the timer if we have a command
        if (data.timestamp && currentCommand) {
          streamTimes.latest = new Date(data.timestamp);
          clearInterval(timingInterval);
          streamTimes.currentMachineTime = streamTimes.latest;
          // Using set interval becasue we DON'T want to trigger a digest cycle.
          timingInterval = setInterval(function () {
            streamTimes.currentMachineTime = new Date(streamTimes.currentMachineTime.getTime() + 1000);
            $rootScope.$applyAsync();
          }, 1000);
          if (!streamTimes.start) {
            streamTimes.start = new Date(data.timestamp);
          }
        }
      });

      refreshAngular();
    }

    function setLastOpenedCommand() {
      if (currentCommand) {
        currentCommand.expanded = true;
      }
    }

    checkExpandingInterval = $interval(setLastOpenedCommand, 100);

    streaming = true;
    stream.on('data', handleStreamData);
    stream.on('end', function () {
      streaming = false;
      clearInterval(timingInterval);
      $interval.cancel(checkExpandingInterval);
      setLastOpenedCommand();
      streamTimes.end = streamTimes.latest;
      stream.off('data', handleStreamData);
    });

    return {
      logs: streamLogs,
      times: streamTimes,
      getRawLogs: function () {
        if (!processedRawLogs) {
          var contentJoined = rawLogs
            .filter(function (data) {
              return data.type !== 'heartbeat';
            })
            .map(function (data) {
              if (data.type === 'progress') {
                return '\n' + JSON.stringify(data.content);
              }
              return data.content;
            })
            .join('');
          processedRawLogs = $sce.trustAsHtml(convert.toHtml(contentJoined));
        }
        return processedRawLogs;
      },
      destroy: function () {
        stream.off('data', handleStreamData);
      }
    };
  };
}

