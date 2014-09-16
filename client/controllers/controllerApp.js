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
  configAPIHost,
  holdUntilAuth,
  QueryAssist,
  primus,
  $localStorage,
  configEnvironment,
  jQuery
) {

  var self = ControllerApp;
  var UTIL = $rootScope.UTIL = {};
  var dataApp = $scope.dataApp = $rootScope.dataApp = self.initState($state,
    $stateParams,
    configAPIHost);
  var data = dataApp.data = {};
  var authed = false;

  // detect when user presses escape and close modals
  // rare violation of controller & dom isolation
  // no need to unbind contApp is instantiated
  // only once in app lifecycle
  jQuery(document).on('keydown', function (e) {
    if (e.keyCode === 27) {
      $rootScope.$broadcast('app-document-click');
      $rootScope.safeApply();
    }
  });

  dataApp.data.configEnvironment = configEnvironment;
  dataApp.data.configAPIHost = configAPIHost;

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

  $rootScope.$on('$stateChangeSuccess', function () {
    // store last visited project for auto-return in contHome
    if ($stateParams.userName && $stateParams.projectName && $stateParams.branchName) {
      $localStorage.stateParams = angular.copy($stateParams);
    }
  });
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
