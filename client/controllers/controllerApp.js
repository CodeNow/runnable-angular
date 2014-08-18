require('app')
  .controller('ControllerApp', ControllerApp);
/**
 * ControllerApp
 * @constructor
 * @export
 * @ngInject
 */
function ControllerApp(
  $rootScope,
  $scope,
  $timeout,
  $interval,
  $document,
  $stateParams,
  $state,
  user,
  apiConfigHost,
  holdUntilAuth,
  QueryAssist,
  primus
) {

  var self = ControllerApp;
  var UTIL = $rootScope.UTIL = {};
  var dataApp = $scope.dataApp = $rootScope.dataApp = self.initState($state,
    $stateParams,
    apiConfigHost);
  var data = dataApp.data = {};
  data.loading = false;

  $interval(function () {
    $rootScope.safeApply();
  }, 1000 * 30); //30 seconds

  primus.onBuildCompletedEvents(function (buildData) {
    holdUntilAuth(function (err, thisUser) {
      if (err) {
        throw err;
      }
      thisUser
        .newProject(buildData.project)
        .newEnvironment(buildData.environment)
        .fetchBuild(buildData._id, function (err) {
          if (err) {
            throw err;
          }
          $rootScope.safeApply(); // FIXME: in the future this could be handled by model store events
        });
    });
  });

  dataApp.documentClickEventHandler = function () {
    $scope.$broadcast('app-document-click');
  };

  dataApp.applyCallbacks = [];
  $rootScope.safeApply = function (cb) {
    if (cb) {
      dataApp.applyCallbacks.push(cb);
    }
    $timeout(function () {
      $scope.$apply();
      dataApp.applyCallbacks.forEach(function (cb) {
        cb();
      });
      dataApp.applyCallbacks = [];
    });
  };

  UTIL.holdUntilAuth = function (cb) {
    holdUntilAuth(function (err, thisUser) {
      if (err) {
        $state.go('home', {});
      } else {
        dataApp.user = thisUser;
        $scope.safeApply();
        if (angular.isFunction(cb)) {
          cb(err);
        }
      }
    });
  };

  UTIL.QueryAssist = QueryAssist;
}

ControllerApp.initState = function ($state, $stateParams, apiHost) {
  var redirect = encodeURI(window.location.protocol + '//' + window.location.host);
  return {
    state: $state,
    stateParams: $stateParams,
    user: null,
    loginURL: apiHost + '/auth/github?redirect=' + redirect,
    logoutURL: apiHost + '/auth/logout?redirect=' + redirect
  };
};
