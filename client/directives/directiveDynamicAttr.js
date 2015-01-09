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

      var jQuery = require('jquery');
      var parsedAttrs = JSON.parse(attrs.dynamicAttr);
      var properties = Object.keys(parsedAttrs);

      var scope = {
        parsedAttrs: parsedAttrs,
        properties: properties,
        jQuery: jQuery,
        keypather: keypather
      };

      properties.forEach(function (prop) {
        $scope.$watch(parsedAttrs[prop], function (val) {
          if (val) {
            jQuery(element).attr(prop, keypather.get($scope, parsedAttrs[prop]));
          } else {
            jQuery(element).removeAttr(prop);
          }
        });
      }, scope);

    }
  };
}
