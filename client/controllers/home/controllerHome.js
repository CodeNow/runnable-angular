var app  = require('app');
var deps = [
  '$scope'
];
deps.push(ControllerHome);
app.controller('ControllerHome', deps);
function ControllerHome ($scope) {
  var dataHome = $scope.dataHome = {};
}