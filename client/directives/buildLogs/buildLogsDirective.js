'use strict';

require('app').directive('buildLogs', buildLogs);
function buildLogs() {
  return {
    restrict: 'A',
    templateUrl: 'buildLogsView',
    controller: 'BuildLogsController as BLC',
    bindToController: true,
    scope: {
      instance: '='
    }
  };
}