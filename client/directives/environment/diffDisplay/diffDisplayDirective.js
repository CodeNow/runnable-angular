'use strict';

require('app')
  .directive('diffDisplay', function fileEditor(
  ) {
    return {
      restrict: 'A',
      templateUrl: 'diffDisplayView',
      scope: {
        fileDiff: '=',
        instance: '=',
        previewAll: '=?'
      },
      link: function ($scope, element, attrs) {
      }
    };
  });
