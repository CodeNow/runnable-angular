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
  currentOrg,
  demoFlowService,
  eventTracking,
  fetchCommitsForInstance,
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
      $scope.currentOrg = currentOrg;
      $scope.openedPRUrl = eventTracking.openedPRUrl;
      $scope.userName = $stateParams.userName;
      $scope.commit = keypather.get($scope, 'instance.contextVersion.appCodeVersions.models[0].attrs.commit');
      fetchCommitsForInstance($scope.instance)
        .then(function(commits) {
          if ($scope.commit !== keypather.get(commits, 'models[0].attrs.sha')) {
            $scope.showCommitHash = true;
          }
        })

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
        return demoFlowService.isInDemoFlow() && demoFlowService.shouldAddPR() && !demoFlowService.getItem('clickedPrLink');
      };
      $scope.isInGuide = ahaGuide.isInGuide;

      $scope.showUrlCallout = function () {
        return demoFlowService.isInDemoFlow() &&
          !!keypather.get($scope.instance, 'contextVersion.getMainAppCodeVersion()') &&
          !demoFlowService.hasSeenUrlCallout() &&
          demoFlowService.hasSeenHangTightMessage() === $scope.instance.attrs.id &&
          keypather.get($scope.instance, 'status()') === 'running';
      };
    }
  };
}
