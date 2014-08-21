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
  var authed = false;

  data.loading = false;
  $rootScope.$on('$stateChangeStart', function () {
    data.loading = false;
  });

  $interval(function () {
    $rootScope.safeApply();
  }, 1000 * 30); //30 seconds

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
    if (authed) { return cb(); }
    holdUntilAuth(function (err, thisUser) {
      if (err) {
        $state.go('home', {});
      } else {
        authed = true;
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
