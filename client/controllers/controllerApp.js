var queryAssist = require('queryAssist');
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
  $stateParams,
  $state,
  user,
  apiConfig,
  holdUntilAuth
) {

  var self = ControllerApp;
  var UTIL = $rootScope.UTIL = {};
  var dataApp = $scope.dataApp = $rootScope.dataApp = self.initState($state,
    $stateParams,
    apiConfig.host);

  dataApp.click = function () {
    $scope.$broadcast('app-document-click');
  };

  dataApp.holdUntilAuth = function (cb) {
    holdUntilAuth(function (err, thisUser) {
      if (err) {
        $state.go('home', {});
      } else {
        dataApp.user = thisUser;
        $scope.safeApply();
        if(angular.isfunction(cb)) {
          cb(err, thisUser);
        }
      }
    });
  };

  $rootScope.safeApply = function (cb) {
    $timeout(function () {
      if (typeof cb === 'function') {
        $scope.$apply(cb);
      } else {
        $scope.$apply();
      }
    });
  };

  UTIL.QueryAssist = queryAssist;
}

ControllerApp.initState = function ($state, $stateParams, apiHost) {
  return {
    state: $state,
    stateParams: $stateParams,
    user: null,
    loginURL: apiHost + '/auth/github?redirect=' + encodeURI('http://localhost:3001'),
    logoutURL: apiHost + '/auth/logout?redirect=' + encodeURI('http://localhost:3001')
  };
};
