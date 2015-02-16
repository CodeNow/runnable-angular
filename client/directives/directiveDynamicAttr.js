'use strict';

require('app')
  .directive('dynamicAttr', dynamicAttr);
/**
 * dynamicAttr Directive
 * @ngInject
 */
function dynamicAttr(
  keypather
) {
  return {
    restrict: 'A',
    // -1 will run before other directives, necessary
    priority: -1,
    link: function ($scope, element, attrs) {

      var parsedAttrs = JSON.parse(attrs.dynamicAttr);
      var properties = Object.keys(parsedAttrs);

      properties.forEach(function (prop) {
        $scope.$watch(parsedAttrs[prop], function (val) {
          if (val) {
            element.attr(prop, keypather.get($scope, parsedAttrs[prop]));
          } else {
            element.removeAttr(prop);
          }
        });
      });

    }
  };
}
