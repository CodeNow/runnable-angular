'use strict';

require('app')
  .directive('instanceList', instanceList);
/**
 * @ngInject
 */
function instanceList(
  getInstanceClasses,
  getInstanceAltTitle,
  getTeamMemberClasses,
  $state,
  $rootScope,
  $timeout
) {
  return {
    restrict: 'A',
    templateUrl: 'viewInstanceList',
    scope: {
      data: '=',
      state: '=',
      actions: '='
    },
    link: function ($scope, ele) {
      $scope.isLoading = $rootScope.isLoading;

      $scope.stateToInstance = function (instance, $event) {
        if ($event && $event.preventDefault) {
          $event.preventDefault();
        }
        $state.go('instance.instance', {
          instanceName: instance.attrs.name,
          userName: instance.attrs.owner.username
        });
      };

      var isLoadingWatch = $scope.$watch('isLoading.sidebar', function (newVal) {
        if (newVal === false) {
          isLoadingWatch();
          $timeout(function () {
            var instanceLink = angular.element(ele[0].querySelector('a.selected'));
            ele.find('ul').scrollToElement(instanceLink, 33*3, 200);
          });
        }
      });

      $scope.getInstanceClasses = getInstanceClasses;
      $scope.getInstanceAltTitle = getInstanceAltTitle;
      $scope.getTeamMemberClasses = getTeamMemberClasses;

      $scope.popoverInvite = {
        data: {
          getTeamName: function () {
            return $state.params.userName;
          }
        }
      };
    }
  };
}
