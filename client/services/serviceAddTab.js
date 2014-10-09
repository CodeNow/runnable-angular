require('app')
  .factory('addTab', addTab);
/**
 * @ngInject
 */
function addTab() {
  var openItems;
  return function(config, openItems) {
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
          if (!openItems) { return; }
          pat.data.show = false;
          return openItems.addBuildStream();
        },
        addWebView: function () {
          if (!openItems) { return; }
          pat.data.show = false;
          return openItems.addWebView();
        },
        addTerminal: function () {
        if (!openItems) { return; }
          pat.data.show = false;
          return openItems.addTerminal();
        },
        addLogs: function () {
          if (!openItems) { return; }
          pat.data.show = false;
          return openItems.addLogs();
        },
        addEnvVars: function () {
          if (!openItems) { return; }
          pat.data.show = false;
          var envVars = openItems.addEnvVars();
          envVars.state.readOnly = config.envVarsReadOnly;
          return envVars;
        }
      },
      addOpenItems: function (_openItems) {
        openItems = _openItems;
      }
    };
    return pat;
  };
}
