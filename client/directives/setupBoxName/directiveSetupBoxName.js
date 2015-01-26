'use strict';

require('app')
  .directive('setupBoxName', setupBoxName);
/**
 * @ngInject
 */
function setupBoxName(
  fetchInstances
) {
  return {
    restrict: 'E',
    templateUrl: 'viewSetupBoxName',
    scope: {
      newInstanceName: '=name',
      valid: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.newInstanceName = '';

      $scope.$watch('newInstanceNameForm.$valid', function () {
        $scope.valid = arguments[0];
      });

      fetchInstances()
      .then(function(instances) {
        $scope.instances = instances;
      });
    }
  };
}
