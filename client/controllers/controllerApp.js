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
  configAPIHost,
  holdUntilAuth,
  QueryAssist,
  primus,
  $localStorage,
  configEnvironment,
  jQuery
) {

  /*
  var dataApp = $scope.dataApp = $rootScope.dataApp = self.initState($state,
    $stateParams,
    configAPIHost);
  */
  var dataApp = $scope.dataApp = {
    data: {},
    actions: {}
  };

  // used in dev-info box
  dataApp.data.configEnvironment = configEnvironment;
  dataApp.data.configAPIHost = configAPIHost;

  /*
  data.loading = false;
  $rootScope.$on('$stateChangeStart', function () {
    data.loading = false;
  });
  */

  /**
   * broadcast to child scopes when click event propagates up
   * to top level controller scope.
   * Used to detect click events outside of any child element scope
   */
  dataApp.documentClickEventHandler = function () {
    $scope.$broadcast('app-document-click');
  };

  /*
  $rootScope.$on('$stateChangeSuccess', function () {
    // store last visited project for auto-return in contHome
    if ($stateParams.userName && $stateParams.projectName && $stateParams.branchName) {
      $localStorage.stateParams = angular.copy($stateParams);
    }
  });
  */
}
/*
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
*/
