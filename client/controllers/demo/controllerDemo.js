require('app')
  .controller('ControllerDemo', ControllerDemo);
/**
 * @ngInject
 */
function ControllerDemo(
  configLogoutURL,
  $scope
) {

  var dataDemo = $scope.dataDemo = {
    data: {},
    actions: {}
  };
  dataDemo.data.logoutURL = configLogoutURL();

}
