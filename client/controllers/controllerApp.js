require('app')
  .controller('ControllerApp', ControllerApp);
/**
 * ControllerApp
 * @constructor
 * @export
 * @ngInject
 */
function ControllerApp(
  $log,
  $scope,
  $state,
  $rootScope,
  $window,
  async,
  configAPIHost,
  configEnvironment,
  configLoginURL,
  configLogoutURL,
  fetchUser,
  keypather,
  QueryAssist,
  user
) {

  var dataApp = $rootScope.dataApp = $scope.dataApp = {
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

  var thisUser,
      thisUserOrgs;

  function fetchOrgs(user, cb) {
    thisUser = user;
    thisUserOrgs = thisUser.fetchGithubOrgs(function (err) {
      cb(err, thisUserOrgs);
    });
  }

  async.waterfall([
    fetchUser,
    fetchOrgs
  ], function(err, results) {
    if (err) {
      $log.error(err);
      if (keypather.get(err, 'data.statusCode') === 401) {
        $state.go('home');
      }
      return;
    }
    if ($window.heap) {
      $window.heap.identify({
        name:  thisUser.oauthName(),
        email: thisUser.attrs.email,
        orgs:  $window.JSON.stringify(thisUserOrgs)
      });
    }
    if ($window.initIntercom) {
      $window.initIntercom({
        name: thisUser.oauthName(),
        email: thisUser.attrs.email,
        // Convert ISO8601 to Unix timestamp
        created_at: +(new Date(thisUser.attrs.created)),
        app_id: 'wqzm3rju'
     });
    }
    if ($window.olark) {
      $window.olark('api.visitor.updateEmailAddress', { emailAddress: thisUser.attrs.email });
      $window.olark('api.visitor.updateFullName', { fullName: thisUser.oauthName() });
      $window.olark('api.box.show');
    }
  });
}
