var app  = require('app');
var deps = [
  '$scope'
];
deps.push(ControllerLayout);
app.controller('ControllerLayout', deps);
function ControllerLayout ($scope) {
  var dataLayout = $scope.dataLayout = {};
  dataLayout.click = function () {
    $scope.$broadcast('app-document-click');
  };
}