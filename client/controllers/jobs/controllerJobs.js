var app = require('app');
var deps = [
  '$scope'
];
deps.push(ControllerJobs);
app.controller('ControllerJobs', deps);
function ControllerJobs ($scope) {
  var dataJobs = $scope.dataJobs = {};
}