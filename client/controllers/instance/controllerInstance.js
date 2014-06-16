var app = require('app');
app.controller('ControllerInstance', ['$scope', function ($scope) {
  var dataInstance = {};
  $scope.dataInstance = dataInstance;
}]);