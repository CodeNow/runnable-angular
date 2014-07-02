require('app')
  .controller('ControllerSetup', ControllerSetup);
/**
 * ControllerSetup
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerSetup (
  $scope
) {
  var self = ControllerSetup;
  var dataSetup = $scope.dataSetup = self.initState();
}

ControllerSetup.initState = function () {
  return {};
};
