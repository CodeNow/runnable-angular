require('app')
  .controller('ControllerInstanceLayout', ControllerInstanceLayout);
/**
 * @ngInject
 */
function ControllerInstanceLayout(
  $scope
){

  var dataInstanceLayout = $scope.dataInstanceLayout = {};
  var data = dataInstanceLayout.data = {};
  var actions = dataInstanceLayout.actions = {};
  /*
      if ($window.heap) {
        // Heap will only be loaded when env !== development
        $window.heap.identify({
          name: thisUser.oauthName(),
          email: thisUser.attrs.email,
          orgs: $window.JSON.stringify(data.orgs)
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
  */
}
