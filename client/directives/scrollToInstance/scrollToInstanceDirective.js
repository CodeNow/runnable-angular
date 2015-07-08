'use strict';

require('app')
  .directive('scrollToInstance', instanceList);
/**
 * @ngInject
 */
function instanceList(
  $timeout
) {
  return {
    restrict: 'A',
    link: function ($scope, ele) {

      var isLoadingWatch = $scope.$watch('CIL.isLoading.sidebar', function (newVal) {
        if (newVal === false) {
          isLoadingWatch();
          $timeout(function () {
            var instanceLink = angular.element(ele[0].querySelector('.selected'));
            if (instanceLink.length) {
              ele.find('ul').scrollToElement(instanceLink, 33*3, 200);
            }
          });
        }
      });
    }
  };
}
