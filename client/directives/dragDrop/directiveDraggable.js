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
          if (e.stopPropagation) { e.stopPropagation(); }
          e.dataTransfer.effectAllowed = 'move';
          var model = ($scope.fs) ? $scope.fs : $scope.dir;
          var modelType = ($scope.fs) ? 'File' : 'Dir';
          // This will allow us to pass the model over the dataTransfer object to the drop cb
          e.dataTransfer.setData('model', JSON.stringify(model));
          e.dataTransfer.setData('modelName', model.attrs.name);
          e.dataTransfer.setData('modelType', modelType);

          e.dataTransfer.setData('oldPath', model.attrs.path);
          e.dataTransfer.setData('oldParentDir', JSON.stringify($scope.parentDir));
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

    }
  };
}
