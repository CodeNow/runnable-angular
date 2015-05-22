'use strict';

require('app')
  .directive('translationRules', function translationRules(
    $timeout,
    keypather,
    parseDiffResponse,
    populateRulesWithWarnings,
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
            var acv = keypather.get($scope, 'state.contextVersion.appCodeVersions.models[0]');
            return testAllTransformRules(acv)
              .then(function (body) {
                $scope.state.diffs = parseDiffResponse(body.diff);
                $scope.state.transformResults = body.results;
                return promisify($scope.state.contextVersion, 'fetch')();
              })
              .then(function () {
                // Now fill in all of the warnings in the rules on the ACV
                populateRulesWithWarnings(
                  keypather.get(
                    $scope,
                    'state.contextVersion.appCodeVersions.models[0].attrs.transformRules'
                  ),
                  $scope.state.transformResults
                );
              })
              .finally(function () {
                $scope.state.recalculating = false;
              });
          }

        };
      }
    };
  });
