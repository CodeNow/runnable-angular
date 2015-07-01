'use strict';

require('app')
  .factory('helperAddTab', helperAddTab);
/**
 * @ngInject
 */
function helperAddTab() {
  return function (config, openItems) {
    var pat = {
      data: {
        show: false,
        options: config
      },
      actions: {
        addBuildStream: function () {
          if (!openItems) {
            return;
          }
          pat.data.show = false;
          return openItems.addBuildStream();
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
