require('app')
  .controller('ControllerInstanceLayout', ControllerInstanceLayout);
/**
 * @ngInject
 */
function ControllerInstanceLayout(
  configLogoutURL,
  $scope
) {

  var dataInstanceLayout = $scope.dataInstanceLayout = {
    data: {},
    actions: {}
  };
  dataInstanceLayout.data.logoutURL = configLogoutURL();

}
