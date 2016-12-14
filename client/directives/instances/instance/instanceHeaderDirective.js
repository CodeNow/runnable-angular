'use strict';

require('app')
  .directive('instanceHeader', instanceHeader);

/**
 * @ngInject
 */
function instanceHeader(
  $localStorage,
  $stateParams,
  ahaGuide,
  demoFlowService,
  eventTracking,
  fetchPullRequest,
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'instanceHeaderView',
    scope: {
      instance: '=',
      openItems: '=',
      demoFlowFlags: '=?'
    },
    link: function ($scope) {
      $scope.$storage = $localStorage;
      $scope.userName = $stateParams.userName;
      $scope.openedPRUrl = function () {
        demoFlowService.endDemoFlow();
        eventTracking.openedPRUrl();
      };
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
      $scope.showPrCallout = function () {
        return demoFlowService.isInDemoFlow() && demoFlowService.shouldAddPR();
      };
      $scope.isInGuide = ahaGuide.isInGuide;

      $scope.showUrlCallout = function () {
        return demoFlowService.isInDemoFlow() &&
          !!keypather.get($scope.instance, 'contextVersion.getMainAppCodeVersion()') &&
          !demoFlowService.hasSeenUrlCallout() &&
          demoFlowService.hasSeenHangTightMessage() &&
          keypather.get($scope.instance, 'status()') === 'running';
      };
    }
  };
}
