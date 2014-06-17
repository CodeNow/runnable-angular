var app = require('app');
app.controller('ControllerApp', [
  '$rootScope',
  '$scope',
  '$state',
  function ($rootScope,
            $scope,
            $state) {
  var rootData = {};
  $scope.rootData = rootData;
  rootData.state = $state;
}]);