require('app')
  .controller('ControllerDemo2', ControllerDemo2);
/**
 * @ngInject
 */
function ControllerDemo2(
  configLogoutURL,
  $scope
) {

  var dataDemo2 = $scope.dataDemo2 = {
    data: {},
    actions: {}
  };
  dataDemo2.data.logoutURL = configLogoutURL();

}
