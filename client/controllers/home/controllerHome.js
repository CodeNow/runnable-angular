var app = require('app');
app.controller('ControllerHome', ['$scope', function ($scope) {
  var homeData = {};
  $scope.homeData = homeData;

  homeData.filters = [1,2,3];
  homeData.projects = [1,2,3];

}]);