var app = require('../app');
app.controller('ControllerIndex', ['$scope', function ($scope) {
  console.log('ControllerIndex');
  $scope.test = 'apples';
  $scope.change = function () {
    $scope.test = 'funky';
  };
}]);