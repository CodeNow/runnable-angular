'use strict';

require('app')
  .directive('instanceList', instanceList);
/**
 * @ngInject
 */
function instanceList(
  $rootScope,
  $timeout
) {
  return {
    restrict: 'A',
    templateUrl: 'viewInstanceList',
    scope: {
      data: '='
    },
    link: function ($scope, ele) {
      $scope.isLoading = $rootScope.isLoading;

    }
  };
}
