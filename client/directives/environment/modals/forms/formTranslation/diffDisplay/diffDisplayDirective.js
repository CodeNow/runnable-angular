'use strict';

require('app')
  .directive('diffDisplay', function fileEditor(
  ) {
    return {
      restrict: 'A',
      templateUrl: 'diffDisplayView',
      scope: {
        actions: '=?',
        fileDiff: '=',
        previewAll: '=?',
        state: '='
      },
      link: function ($scope, element, attrs) {
      }
    };
  });
