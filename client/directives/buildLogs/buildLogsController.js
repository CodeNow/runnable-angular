'use strict';

require('app').controller('BuildLogsController', BuildLogsController);

function BuildLogsController(
  streamingLog
) {

  console.log('Build logs controller!');
  //this.instance.getBuildLogs()


  console.log(this.instance);

  var rawLogs = this.instance.contextVersion.attrs.build.log.split('\n');
  console.log(rawLogs);

  var emit = false;
  var counter = 0;

  var stream = {
    on: function (key, cb) {
      function emitLog () {
        setTimeout(function () {
          if (emit) {
            if (rawLogs.length > counter) {
              var rawLog = rawLogs[counter];
              var newLog = {
                content: rawLog
              };
              if (/Step [0-9]+ :/.test(rawLog) || counter===0) {
                newLog.type = 'command';
                newLog.imageId = Math.floor(Math.random()*100000);
              } else {
                newLog.type = 'log';
              }
              if (rawLog.indexOf('--->') === -1) {
                cb(newLog);
              }
              counter += 1;
              emitLog();
            }
          }
        }, Math.random()*600);
      }
      emit = true;
      emitLog();
    },
    off: function (key, cb) {
      emit = false;
    }
  };

  var streamingBuildLogs = streamingLog(stream);

  this.buildLogs = streamingBuildLogs.logs;
}