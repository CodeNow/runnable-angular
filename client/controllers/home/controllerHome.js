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
  fetchUser,
  keypather,
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

  fetchUser().then(function(user) {
    var lastOrg = keypather.get(user, 'attrs.userOptions.uiState.previousLocation.org');
    if (lastOrg) {
      $state.go('instance.home', {
        userName: lastOrg
      }, {location: 'replace'});
    } else {
      $state.go('orgSelect', {}, {location: 'replace'});
    }
  }).catch(function (err) {
    $scope.dataApp.data.loading = false;
    errs.handler(err);
  });

}
