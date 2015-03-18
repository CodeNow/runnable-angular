'use strict';

require('app')
  .directive('togglePopOver', togglePopOver);
/**
 * togglePopOver Directive
 * @ngInject
 */
function togglePopOver(
  $rootScope,
  $timeout
) {
  return {
    restrict: 'A',
    scope: {
      model: '=togglePopOverModel',
      popoverOptions: '=togglePopOverOptions',
      noBroadcast: '=togglePopOverNoBroadcast',
      rightClick: '=togglePopOverRightClick'
    },
    link: function ($scope, element) {
      function clickHandler(event) {
        if ($scope.rightClick || (!$scope.model && !element.prop('disabled'))) {
          event.stopPropagation();
          event.preventDefault();
          // Skip broadcasting if we're in a modal
          if (!$scope.noBroadcast) {
            $rootScope.$broadcast('app-document-click');
          }
          if ($scope.rightClick) {
            $scope.popoverOptions = JSON.stringify({
              left: event.pageX + 'px',
              top: event.pageY - 18 + 'px',
              mouse: true
            });
          }
          $scope.model = true;
          $timeout(angular.noop);
        } else if ($scope.model) {
          $scope.model = false;
        }
      }
      if ($scope.rightClick) {
        element.on('contextmenu', clickHandler);
        $scope.$on('$destroy', function () {
          element.off('contextmenu');
        });
      } else {
        element.on('click', clickHandler);
        $scope.$on('$destroy', function () {
          element.off('click');
        });
      }
      $scope.$on('app-document-click', function () {
        $scope.model = false;
      });
    }
  };
}
