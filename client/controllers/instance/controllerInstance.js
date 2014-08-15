require('app')
  .controller('ControllerInstance', ControllerInstance);
/**
 * ControllerInstance
 * @constructor
 * @export
 * @ngInject
 */
function ControllerInstance(
  $scope,
  $state,
  $stateParams,
  async,
  user,
  OpenItems
) {
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var self = ControllerInstance;

  var dataInstance = $scope.dataInstance = {};
  var data = dataInstance.data;
  var actions = dataInstance.actions;

  /*********************************
   * popoverFileMenu
   *********************************/
  var pfm = data.popoverFileMenu = {};
  pfm.data = {};
  pfm.data.show = false;
  pfm.actions = {};

  pfm.actions.createFile = function () {};

  pfm.actions.createFolder = function () {};

  /*********************************
   * popoverAddTab
   *********************************/
  var pat = data.opoverAddTab.filter = '';

  pat.actions.addOutputStream = function () {
    pat.data.show = false;
    //TODO
  };

  pat.actions.addWebView = function () {
    pat.data.show = false;
    data.openItems.addWebView({
      name: 'Web View'
    });
  };

  pat.actions.addTerminal = function () {
    pat.data.show = false;
    data.openItems.addTerminal({
      name: 'Terminal',
      params: data.instance.attrs.containers[0]
    });
  };

  pat.actions.addLogs = function () {
    pat.data.show = false;
    data.openItems.addLogs({
      name: 'Server Logs',
      params: data.instance.attrs.containers[0]
    });
  };

  $scope.$watch(function () {
    if (data.openItems && data.openItems.activeFile) {
      return data.openItems.activeFile.attrs.body;
    }
  }, function () {
    $scope.safeApply();
  });

  /* ============================
   *   API Fetch Methods
   * ===========================*/
  function fetchInstance(cb) {
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchInstance')
      .query($stateParams.instanceId)
      .cacheFetch(function updateDom(instance, cached, cb) {
        if (!instance) {
          return $state.go(404);
        }
        data.instance = instance;
        data.version = data.container = instance.containers.models[0];
        if (data.container && data.container.running()) {
          data.showExplorer = true;
        } else {
          data.showExplorer = false;
        }
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, instance, cb) {
        if (!instance || !instance.containers.models.length) {
          return cb(new Error('Instance not found'));
        }
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  function newOpenItems(cb) {
    data.openItems = new OpenItems();
    var container = data.container;
    if (container && container.urls().length) {
      pat.actions.addWebView();
      pat.actions.addTerminal();
    }
    pat.actions.addLogs();
    cb();
  }

  async.waterfall([
    holdUntilAuth,
    fetchInstance,
    newOpenItems
  ], function (err) {
    if (err) {
      $state.go('404');
      throw err;
    }
    $scope.safeApply();
  });
}
