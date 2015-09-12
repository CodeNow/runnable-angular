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
      state: '=',
      newContainer: '=?'
    },
    link: function ($scope) {
      $scope.temp = {
        stackKey: keypather.get($scope, 'state.selectedStack.key')
      };
      $scope.saving = false;

      $scope.$watch('temp.stackKey', function (newStackKey, oldStackKey) {
        if (newStackKey === oldStackKey) {
          return;
        }
        var newStack = $scope.data.stacks.find(function (stack) {
          return stack.key === newStackKey;
        });
        if (newStack) {
          // Since we are adding info to the stack object, and those objects are going to get reused,
          // we should listen to the model changes, and copy the result
          $scope.state.selectedStack = angular.copy(newStack);
          $scope.saving = true;
          return loadingPromises.add(
            $scope.loadingPromisesTarget,
            createDockerfileFromSource($scope.state.contextVersion, newStack.key)
              .then(function (dockerfile) {
                $scope.state.dockerfile = dockerfile;
                return updateDockerfileFromState($scope.state);
              })
          )
            .catch(errs.handler)
            .then(function () {
              $scope.saving = false;
            });
        }
      });

      $scope.updateDockerfile = function () {
        return loadingPromises.finished($scope.loadingPromisesTarget)
          .then(function () {
            return loadingPromises.add($scope.loadingPromisesTarget, updateDockerfileFromState($scope.state));
          });
      };
    }
  };
}
