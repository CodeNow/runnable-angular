'use strict';

require('app')
  .directive('droppable', droppable);
/**
 * @ngInject
 */
function droppable(
) {
  return {
    restrict: 'A',

    link: function ($scope, element, attrs) {
      // this gives us the native JS object
      var el = element[0];

      el.addEventListener(
        'dragover',
        function (e) {
          e.dataTransfer.dropEffect = 'move';
          // allows us to drop
          if (e.preventDefault) { e.preventDefault(); }
          this.classList.add('over');
          return false;
        },
        false
      );
      el.addEventListener(
        'dragenter',
        function (e) {
          this.classList.add('over');
          return false;
        },
        false
      );
      el.addEventListener(
        'dragleave',
        function (e) {
          this.classList.remove('over');
          return false;
        },
        false
      );
      el.addEventListener(
        'drop',
        function (e) {
          // Stops some browsers from redirecting.
          if (e.stopPropagation) { e.stopPropagation(); }

          this.classList.remove('over');

          $scope.actions.drop(e.dataTransfer, $scope.dir);

          return false;
        },
        false
      );
    }
  };
}
