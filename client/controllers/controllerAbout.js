var app = require('../app');
app.controller('ControllerAbout', ['$scope', function ($scope) {
  console.log('ControllerAbout');
  $scope.test = 'About Controller';
}]);