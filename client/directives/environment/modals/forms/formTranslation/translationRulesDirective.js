'use strict';

require('app')
  .directive('translationRules', function translationRules(
    errs,
    keypather,
    parseDiffResponse,
    promisify,
    testAllTransformRules
  ) {
    return {
      restrict: 'A',
      templateUrl: 'viewFormTranslation',
      link: function ($scope, elem, attrs) {
        $scope.$watch('state.contextVersion', function (contextVersion) {
          if (contextVersion) {
            $scope.actions.recalculateRules();
          }
        });
        $scope.actions = {
          recalculateRules: function () {
            $scope.state.recalculating = true;
            var acv = keypather.get($scope, 'state.contextVersion.getMainAppCodeVersion()');
            return testAllTransformRules(acv)
              .then(function (body) {
                $scope.state.diffs = parseDiffResponse(body.diff);
                $scope.state.transformResults = body.results;
                return promisify($scope.state.contextVersion, 'fetch')();
              })
              .catch(errs.handler)
              .finally(function () {
                $scope.state.recalculating = false;
              });
          },
          checkFileIgnored: function (fileDiff) {
            var acv = keypather.get($scope, 'state.contextVersion.getMainAppCodeVersion()');
            if (acv) {
              return acv.attrs.transformRules.exclude.indexOf(fileDiff.from) >= 0;
            }
          }

        };
      }
    };
  });
