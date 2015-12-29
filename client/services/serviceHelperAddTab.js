'use strict';

require('app')
  .factory('helperAddTab', helperAddTab);
/**
 * @ngInject
 */
function helperAddTab() {
  return function (openItems) {
    var pat = {
      data: {
        show: false,
        options: {
          build: true,
          server: true,
          term: true
        }
      },
      actions: {
        addBuildStream: function () {
          if (!openItems) {
            return;
          }
          pat.data.show = false;
          return openItems.addBuildStream();
        },
        addBackupStream: function () {
          if (!openItems) {
            return;
          }
          pat.data.show = false;
          return openItems.addBackupStream();
        },
        addTerminal: function () {
          if (!openItems) {
            return;
          }
          pat.data.show = false;
          return openItems.addTerminal();
        },
        addLogs: function () {
          if (!openItems) {
            return;
          }
          pat.data.show = false;
          return openItems.addLogs();
        }
      }
    };
    return pat;
  };
}
