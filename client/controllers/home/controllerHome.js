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
  $scope,
  $location,
  $state,
  loading
) {

  var dataHome = $scope.dataHome = {
    data: {},
    actions: {}
  };

  dataHome.data.hasPass = !!$location.search().password;

  if ($location.search().auth) {
    loading('main', true);
  }

  pFetchUser().then(function(user) {
    var lastOrg = keypather.get(user, 'attrs.userOptions.uiState.previousLocation.org');
    if (lastOrg) {
      $state.go('instance.home', {
        userName: lastOrg
      }, {location: 'replace'});
    } else {
      $state.go('orgSelect', {}, {location: 'replace'});
    }
    loading('main', false);
  }).catch(function (err) {
    loading('main', false);
    errs.handler(err);
  });

}
