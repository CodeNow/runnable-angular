'use strict';

require('app').directive('scrollTo', scrollTo);

function scrollTo(
  $timeout
) {
  return {
    restrict: 'A',
    link: function ($scope, elem, attrs) {
      $timeout(function () {
        // converts string to integer
        var scrollOffset = +attrs.scrollOffset || 0;
        var scrollSpeed = +attrs.scrollSpeed || 300;
        if (attrs.scrollTo) {
          var scrollTarget = elem[0].querySelector(attrs.scrollTo);
          if (scrollTarget) {
            elem.scrollToElement(scrollTarget, scrollOffset, scrollSpeed);
          }
        }
      }, 100);
    }
  };
}
