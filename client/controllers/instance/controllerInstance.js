var app = require('app');
var deps = [
  '$scope'
];
deps.push(ControllerInstance);
app.controller('ControllerInstance', deps);
function ControllerInstance ($scope) {
  var dataInstance = $scope.dataInstance = {};
}