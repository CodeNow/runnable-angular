var app  = require('app');
var deps = [
  '$rootScope',
  '$scope',
  '$state'
];
deps.push(ControllerApp);
app.controller('ControllerApp', deps);
function ControllerApp ($rootScope,
                        $scope,
                        $state) {
  var dataApp = $scope.dataApp = {};
  dataApp.state = $state;
}