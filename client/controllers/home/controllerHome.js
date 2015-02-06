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
  errs,
  pFetchUser,
  keypather,
  $localStorage,
  $scope,
  $location,
  $state
) {

  var dataHome = $scope.dataHome = {
    data: {},
    actions: {}
  };

  dataHome.data.hasPass = !!$location.search().password;

  if ($location.search().auth) {
    $scope.dataApp.data.loading = true;
  }

  pFetchUser().then(function(user) {
    $state.go('instance.home', {
      userName: keypather.get($localStorage, 'stateParams.userName') ||
          user.oauthName()
    }, {
      location: 'replace'
    });
  }).catch(errs.handler);

}
