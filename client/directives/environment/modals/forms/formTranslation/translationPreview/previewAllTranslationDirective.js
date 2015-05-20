'use strict';

require('app')
  .directive('previewAllTranslation', function previewAllTranslation(
    promisify
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
            return promisify(contextVersion, 'fetch')()
              .then(function (cv) {
                var diffs = cv.appCodeVersions.models[0].attrs.transformRules;
                console.log('PREVIEW', diffs);
              })
              .finally(function () {
                $scope.loading = false;
              });
          }
        });
      }
    };
  });
