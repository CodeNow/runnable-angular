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
        actions: '=',
        state: '='
      },
      link: function ($scope, element, attrs) {
      }
    };
  });
