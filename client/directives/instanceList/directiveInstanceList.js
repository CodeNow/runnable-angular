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

      var isLoadingWatch = $scope.$watch('isLoading.sidebar', function (newVal) {
        if (newVal === false) {
          isLoadingWatch();
          $timeout(function () {
            var instanceLink = angular.element(ele[0].querySelector('.selected'));
            ele.find('ul').scrollToElement(instanceLink, 33*3, 200);
          });
        }
      });
    }
  };
}
