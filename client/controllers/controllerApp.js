var app  = require('app');
app.controller('ControllerApp', ControllerApp);
/**
 * ControllerApp
 * @constructor
 * @export
 * @ngInject
 */
function ControllerApp ($scope,
                        $state) {
  var dataApp = $scope.dataApp = {};
  dataApp.state = $state;
  dataApp.click = function () {
    $scope.$broadcast('app-document-click');
  };
}