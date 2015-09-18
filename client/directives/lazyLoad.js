'use strict';

require('app')
  .directive('lazyLoad', lazyLoad);

function lazyLoad(
  $ocLazyLoad,
  $compile
) {
  return {
    restrict: 'A',
    link: function ($scope, element, attrs) {
      var key = attrs.lazyLoad;
      if ($ocLazyLoad.isLoaded(key)) {
        return;
      }
      element.html('<div class="spinner-wrapper spinner-backdrop spinner-md in"><svg height="30" viewbox="0 0 32 32" width="30" class="spinner spinner-md"><circle cx="16" cy="16" fill="none" r="15" stroke-dasharray="60, 12" stroke-linecap="round" stroke-width="2" class="path"></circle></svg></div>');
      $ocLazyLoad.load(key).then(function() {
        // WARNING: This won't work well if you have stacking directives and replace:true.
        $compile(angular.element(element))($scope);
      });
    }
  };
}


