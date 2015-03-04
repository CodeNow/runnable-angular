'use strict';

// This code taken from  http://blog.parkji.co.uk/2013/08/11/native-drag-and-drop-in-angularjs.html
require('app')
  .directive('draggable', draggable);
/**
 * @ngInject
 */
function draggable(
) {
  return {
    restrict: 'A',
    link: function ($scope, element, attrs) {
      // this gives us the native JS object
      var el = element[0];

      el.draggable = true;

      el.addEventListener(
        'dragstart',
        function (e) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('Text', this.id);
          this.classList.add('drag');
          return false;
        },
        false
      );

      el.addEventListener(
        'dragend',
        function (e) {
          this.classList.remove('drag');
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

          var binId = this.id;
          var item = document.getElementById(e.dataTransfer.getData('Text'));
          this.appendChild(item);
// call the passed drop function
          $scope.$apply(function(scope) {
            var fn = scope.drop();
            if ('undefined' !== typeof fn) {
              fn(item.id, binId);
            }
          });

          return false;
        },
        false
      );
    }
  };
}
