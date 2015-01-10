'use strict';

require('app')
  .directive('contenteditable', contenteditable);
/**
 * @ngInject
 */
function contenteditable() {
  return {
    restrict: 'A',
    require: '?ngModel',
    link: function (scope, element, attributes, ngModel) {
      if (!ngModel) {
        return;
      }

      ngModel.$render = function () {
        element.html(ngModel.$viewValue || '');
      };

      element.on('blur keyup change', function () {
        scope.$apply(read);
      });

      read(); // initialize

      // write data to the model
      function read() {
        var html = element.html();
        ngModel.$setViewValue(html);
      }
    }
  };
}
