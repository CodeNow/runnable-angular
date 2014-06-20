var app  = require('app');
var deps = [
  '$scope'
];
deps.push(ControllerAbout);
app.controller('ControllerAbout', deps);
function ControllerAbout ($scope) {
  var dataAbout = $scope.dataAbout = {};
}