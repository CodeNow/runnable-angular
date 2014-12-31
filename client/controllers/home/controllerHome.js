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

  $scope.goToInstance = verifyUserIsAuth;

  function verifyUserIsAuth() {
    async.series([
      function (cb) {
        fetchUser(function (err, user) {
          if (err) { return cb(err); }
          $scope.user = user;
          $scope.safeApply();
          cb();
        });
      },
      function sendUserSomewhere(cb) {

        var thisUser = $scope.user;

        $state.go('instance.home', {
          userName: keypather.get($localStorage, 'stateParams.userName') ||
              thisUser.oauthName()
        });
        return cb();

      }
    ], errs.handler);
  }

}
