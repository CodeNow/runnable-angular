'use strict';

require('app')
  .directive('ModalStackSelector', ModalStackSelector);
/**
 * @ngInject
 */
function ModalStackSelector(
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalStackSelector',
    scope: {
      data: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
      keypather.set($scope, 'actions.selectStack', function (stack) {
        console.log('STACK CHANGE', stack);
        keypather.set($scope, 'state.stack', stack);
      });
      keypather.set($scope, 'actions.selectVersion', function (dep, version) {
        console.log('req CHANGE', dep, version);
        keypather.set($scope, 'state.version.' + version.name, version);
      });
      $scope.$watch('state.stack', function (stack, p) {
        if (stack) {
          $scope.state.version = {};
          stack.versionReqs.forEach(function (version) {
            keypather.set($scope, 'state.version.' + version.name, version.selected);
          });
          keypather.set($scope, 'state.ports', stack.ports.join(','));
          keypather.set($scope, 'state.startCommand', stack.startCommand);
        }
      });
    }
  };
}
