require('app')
  .controller('ControllerApp', ControllerApp);
/**
 * ControllerApp
 * @constructor
 * @export
 * @ngInject
 */
function ControllerApp(
  $scope,
  configAPIHost,
  configEnvironment,
  configLoginURL,
  configLogoutURL
) {

  var dataApp = $scope.dataApp = {
    data: {},
    actions: {}
  };

  // used in dev-info box
  dataApp.data.configEnvironment = configEnvironment;
  dataApp.data.configAPIHost = configAPIHost;

  dataApp.data.minimizeNav = false;
  dataApp.data.loginURL = configLoginURL();
  dataApp.data.logoutURL = configLogoutURL();

  // shows spinner overlay
  dataApp.data.loading = false;
  $scope.$on('$stateChangeStart', function () {
    dataApp.data.loading = false;
  });

  /**
   * broadcast to child scopes when click event propagates up
   * to top level controller scope.
   * Used to detect click events outside of any child element scope
   */
  dataApp.documentClickEventHandler = function () {
    $scope.$broadcast('app-document-click');
  };
}
