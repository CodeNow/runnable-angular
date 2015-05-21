'use strict';

require('app')
  .directive('previewAllTranslation', function previewAllTranslation(
    parseDiffResponse,
    promisify,
    testAllTransformRules
  ) {
    return {
      restrict: 'A',
      templateUrl: 'previewAllTranslationView',
      scope: {
        state: '='
      },
      link: function ($scope, element, attrs) {
        $scope.$watch('state.contextVersion', function (contextVersion) {
          if (contextVersion) {
            $scope.loading = true;
            return testAllTransformRules(contextVersion.appCodeVersions.models[0])
              .then(function (body) {
                $scope.diffs = parseDiffResponse(body.diff);
              })
              .finally(function (body) {
                $scope.loading = false;
              });
          }
        });
      }
    };
  });
