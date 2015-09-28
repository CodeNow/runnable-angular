'use strict';

require('app')
  .directive('serverStatusCardHeader', serverStatusCardHeader);
/**
 * @ngInject
 */
function serverStatusCardHeader(
  $rootScope
) {
  return {
    restrict: 'E',
    replace: false,
    scope: {
      instance: '= instance',
      noTouching: '=? noTouching',
      openEditServerModal: '= openEditServerModal',
      actions: '= actions',
      inModal: '=? inModal'
    },
    templateUrl: function (elem, attrs) {
      if ($rootScope.featureFlags.cardStatus) {
        return 'serverStatusCardHeaderViewCardStatus';
      }
      return 'serverStatusCardHeaderView';
    },
    link: function ($scope, elem, attrs) {
      $scope.popoverServerActions = {
        openEditServerModal: function (defaultTab) {
          $rootScope.$broadcast('close-popovers');
          $scope.openEditServerModal(defaultTab);
        },
        deleteServer: function () {
          $scope.actions.deleteServer($scope.instance);
        }
      };
    }
  };
}
