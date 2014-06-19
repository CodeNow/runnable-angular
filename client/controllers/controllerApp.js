var app = require('app');
app.controller('ControllerApp', [
  '$rootScope',
  '$scope',
  '$state',
  function ($rootScope,
            $scope,
            $state) {
  var appData = $scope.appData = {};
  appData.state = $state;
}]);