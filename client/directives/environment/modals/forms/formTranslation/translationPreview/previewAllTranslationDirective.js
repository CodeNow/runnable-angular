'use strict';

require('app')
  .directive('previewAllTranslation', function previewAllTranslation(
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
