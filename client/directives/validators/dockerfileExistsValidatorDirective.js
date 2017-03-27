'use strict';

require('app').directive('dockerfileExistsValidator', dockerfileExistsValidator);

function dockerfileExistsValidator(
  $q,
  doesDockerfileExist,
  eventTracking,
  fetchRepoDockerfile,
  keypather
) {
  return {
    require: 'ngModel',
    restrict: 'A',
    scope: {
      branchName: '=',
      fullRepo: '='
    },
    link: function ($scope, elem, attrs, ngModel) {
      ngModel.$asyncValidators.dockerfileExists = function (modelValue, viewValue) {
        if (ngModel.$isEmpty(modelValue)) {
          // consider empty models to be valid
          return $q.when();
        }
        if (!$scope.branchName || !$scope.fullRepo) {
          return $q.reject(new Error('dockerfileExistsValidator is missing scope values'));
        }
        return fetchRepoDockerfile($scope.fullRepo, $scope.branchName, modelValue)
          .then(doesDockerfileExist)
          .then(function (dockerfile) {
            eventTracking.filePathChanged(modelValue);
            if (!keypather.get(dockerfile, 'content')) {
              return $q.reject('file doesn’t exist');
            }
            $scope.$emit('dockerfileExistsValidator::valid', modelValue, attrs.dockerfileExistsValidator);
          });
      };
    }
  };
}
