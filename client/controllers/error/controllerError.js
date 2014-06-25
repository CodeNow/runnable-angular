var app = require('app');
app.controller('ControllerError', ControllerError);
/**
 * ControllerBuildList
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerError ($scope) {
  var dataError = $scope.dataError = {};
  console.log('p1');
}