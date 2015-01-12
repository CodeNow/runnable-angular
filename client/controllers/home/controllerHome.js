'use strict';

require('app')
  .controller('ControllerHome', ControllerHome);
/**
 * ControllerHome
 * @constructor
 * @export
 * @ngInject
 */
function ControllerHome(
  async,
  errs,
  fetchUser,
  $filter,
  keypather,
  $localStorage,
  $location,
  QueryAssist,
  $scope,
  $state,
  user,
  $window
) {

  var dataHome = $scope.dataHome = {
    data: {},
    actions: {}
  };

  dataHome.data.hasPass = !!$location.search().password;

  if ($location.search().auth) {
    $scope.dataApp.data.loading = true;
    verifyUserIsAuth(true);
  }
  $scope.goToInstance = verifyUserIsAuth;

  function verifyUserIsAuth(authed) {
    async.series([
      function (cb) {
        fetchUser(function (err, user) {
          if (err) { return cb(err); }
          $scope.user = user;
          cb();
        });
      },
      function sendUserSomewhere(cb) {

        var thisUser = $scope.user;
        var opts = authed ? {location: 'replace'} : null;
        $state.go('instance.home', {
          userName: keypather.get($localStorage, 'stateParams.userName') ||
              thisUser.oauthName()
        }, opts);
        return cb();

      }
    ], errs.handler);
  }

}
