'use strict';

require('app')
  .directive('lazyLoad', lazyLoad);

function lazyLoad(
  $ocLazyLoad,
  $compile,
  $timeout
) {
  return {
    restrict: 'A',
    link: function ($scope, element, attrs) {
      $scope.lazyRefresh = function () {
        reloadElement();
      };

      function reloadElement() {
        // Prevent this directive from getting called in a loop!
        element[0].removeAttribute('lazy-load');

        // The timeout here is to make sure that if it was loaded and rendered in the same digest it is finished being registered
        // As far as I can tell this timeout prevents bugs where the lazy-loaded directive isn't executed.
        $timeout(function () {
          $compile(angular.element(element))($scope);
        }, 0);
      }

      var key = attrs.lazyLoad;
      if ($ocLazyLoad.isLoaded(key)) {
        return reloadElement();
      }
      element.html('<div class="spinner-wrapper spinner-backdrop spinner-md in"><svg height="30" viewbox="0 0 32 32" width="30" class="spinner spinner-md"><circle cx="16" cy="16" fill="none" r="15" stroke-dasharray="60, 12" stroke-linecap="round" stroke-width="2" class="path"></circle></svg></div>');
      $ocLazyLoad.load(key).then(function() {
        reloadElement();
      });
    }
  };
}


