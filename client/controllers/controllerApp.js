var app = require('app');

app.controller('ControllerApp', ['$scope', '$state', function ($scope, $state) {
  var rootData = {};
  $scope.rootData = rootData;
  rootData.state = $state;
}]);
