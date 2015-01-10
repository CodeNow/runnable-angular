'use strict';

require('app')
  .factory('helperAddTab', helperAddTab);
/**
 * @ngInject
 */
function helperAddTab(
  $state
) {
  return function (config, openItems) {
    if (!config) {
      // default to all available
      config = {
        webView: true,
        terminal: true,
        buildStream: true,
        logs: true,
        envVars: true,
        envVarsReadOnly: true
      };
    }
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
        addWebView: function () {
          if (!openItems) {
            return;
          }
          pat.data.show = false;
          return openItems.addWebView();
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
        },
        addEnvVars: function () {
          if (!openItems) {
            return;
          }
          pat.data.show = false;
          var envVars = openItems.addEnvVars();
          if ($state.$current.name === 'instance.instance') {
            envVars.state.readOnly = true;
          }
          return envVars;
        }
      }
    };
    return pat;
  };
}
