'use strict';

require('app')
  .directive('stackSelectorForm', stackSelectorForm);
/**
 * @ngInject
 */
function stackSelectorForm(
  createDockerfileFromSource,
  errs,
  keypather,
  loadingPromises,
  updateDockerfileFromState
) {
  return {
    restrict: 'A',
    templateUrl: 'viewFormStack',
    scope: {
      data: '=',
      loadingPromisesTarget: '@?',
      state: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.temp = {
        stack: keypather.get($scope, 'state.selectedStack')
      };

      $scope.newStackSelected = function (newStack) {
        return loadingPromises.add(
          $scope.loadingPromisesTarget,
          createDockerfileFromSource($scope.state.contextVersion, newStack.key)
            .then(function (dockerfile) {
              $scope.state.dockerfile = dockerfile;
              return updateDockerfileFromState($scope.state);
            })
        )
          .catch(errs.handler);
      };

      $scope.updateDockerfile = function () {
        return loadingPromises.finished($scope.loadingPromisesTarget)
          .then(function () {
            return loadingPromises.add($scope.loadingPromisesTarget, updateDockerfileFromState($scope.state));
          });
      };

      // Since we are adding info to the stack object, and those objects are going to get reused,
      // we should listen to the model changes, and copy the result
      $scope.$watch('temp.stack', function (stack) {
        if (stack) {
          $scope.state.selectedStack = angular.copy(stack);
        }
      });
    }
  };
}
