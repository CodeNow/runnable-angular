'use strict';

require('app')
  .directive('instanceHeader', instanceHeader);

/**
 * @ngInject
 */
function instanceHeader(
  $localStorage,
  $rootScope,
  $stateParams,
  ahaGuide,
  fetchPullRequest,
  ModalService
) {
  return {
    restrict: 'A',
    templateUrl: 'instanceHeaderView',
    scope: {
      instance: '=',
      openItems: '='
    },
    link: function ($scope) {
      $scope.$storage = $localStorage;
      $scope.userName = $stateParams.userName;
      $scope.$watch('instance', function (newValue) {
        if (!newValue) {
          return;
        }
        fetchPullRequest($scope.instance)
          .then(function (pr) {
            if (pr) {
              $scope.pr = pr;
            }
          });
      });
      $scope.toggleAhaModal = function () {
        $rootScope.$broadcast('close-popovers');
        ModalService.showModal({
          controller: 'AhaModalController',
          controllerAs: 'AMC',
          templateUrl: 'ahaModal'
        });
      };
      $scope.isInGuide = ahaGuide.isInGuide;
    }
  };
}
