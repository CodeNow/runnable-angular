require('app')
  .controller('ControllerHome', ControllerHome);
/**
 * ControllerHome
 * @constructor
 * @export
 * @ngInject
 */
function ControllerHome(
  $scope,
  $state,
  $location,
  $window,
  skrollr,
  async,
  errs,
  $localStorage,
  keypather,
  QueryAssist,
  fetchUser,
  user,
  $filter
) {

  var dataHome = $scope.dataHome = {
    data: {},
    actions: {}
  };

  //- refresh skrollr on load
  $window.s = skrollr.init({
    forceHeight: false,
    mobileCheck: function () {
      return false;
    }
  });
  $window.s.refresh();

  dataHome.data.hasPass = !!$location.search().password;
  dataHome.data.auth = !!$location.search().auth;

  if (!!$location.search().auth) {
    verifyUserIsAuth(true);
  }
  $scope.goToInstance = verifyUserIsAuth;

  function verifyUserIsAuth(authed) {
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
