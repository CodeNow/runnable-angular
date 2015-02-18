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
      noBroadcast: '=togglePopOverNoBroadcast'
    },
    link: function ($scope, element, attrs) {
      function clickHandler (event) {
        if (!$scope.model && !element.prop('disabled')) {
          event.stopPropagation();
          // Skip broadcasting if we're in a modal
          if (!$scope.noBroadcast) {
            $rootScope.$broadcast('app-document-click');
          }
          $scope.model = true;
          $timeout(angular.noop);
        } else if ($scope.model) {
          $scope.model = false;
        }
      }
      element.on('click', clickHandler);
      $scope.$on('$destroy', function () {
        element.off('click');
      });
      $scope.$on('app-document-click', function () {
        $scope.model = false;
      });
    }
  };
}
