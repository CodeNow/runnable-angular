require('app')
  .controller('ControllerInstanceHome', ControllerInstanceHome);
/**
 * @ngInject
 */
function ControllerInstanceHome(
  $filter,
  $stateParams,
  $state,
  $scope,
  $localStorage,
  $rootScope,
  keypather
) {
  var userName = $stateParams.userName;
  var instanceName = keypather.get($localStorage, 'lastInstancePerUser.' + userName);
  if (!instanceName) {
    $scope.loading = true;
    var unwatch = $rootScope.$watch('dataApp.data.instances', function(n) {
      if (n) {
        unwatch();
        if (userName === $rootScope.dataApp.data.activeAccount.oauthName()) {
          $scope.loading = false;
          var models = $filter('orderBy')(n.models, 'attrs.name');
          var name = keypather.get(n, 'models[0].attrs.name');
          goToInstance(userName, name);
        }
      }
    });
  } else {
    goToInstance(userName, instanceName);
  }
  function goToInstance(username, instanceName) {
    if (instanceName) {
      $state.go('instance.instance', {
        instanceName: instanceName,
        userName: username
      }, {location: 'replace'});
    } else {
      $state.go('instance.new', {
        userName: username
      }, {location: 'replace'});
    }
  }

}
