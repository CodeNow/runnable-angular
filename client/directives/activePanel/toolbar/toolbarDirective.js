'use strict';

require('app')
  .directive('toolbarDirective', toolbarDirective);

function toolbarDirective(
  
) {
  return {
    restrict: 'A',
    scope: {
      template: '= toolbarTemplate',
      showToolbar: '='
    },
    link: function ($scope, elem, attrs) {
      if (!$scope.template) {
        // Check if the string is set by checking the attrs
        if (attrs.toolbarTemplate) {
          $scope.template = attrs.toolbarTemplate;
        } else {
          return $log.error('Toolbar needs a template');
        }
      }
      $scope.showToolbar = true;
    }
  };
}
