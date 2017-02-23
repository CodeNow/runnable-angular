'use strict';

require('app')
  .directive('hangTight', hangTight);

function hangTight(
  $interval,
  demoFlowService,
  eventTracking,
  loading,
  watchOncePromise
) {
  return {
    restrict: 'A',
    templateUrl: 'firstBuildNotificationView',
    scope: {
      instance: '='
    },
    link: function ($scope) {
      var instance = $scope.instance;

      watchOncePromise($scope, function () {
        return instance.status() === 'running';
      }, true)
        .then(pollContainerUrl);

      function pollContainerUrl () {
        eventTracking.polledContainerUrl();
        var timesToPoll = 15;
        loading('demoUrlPolling', true);
        var stopPolling = $interval(function (timesToPoll) {
          // zero indexed, once we've polled 15 times just go to add branch
          if (timesToPoll === 14 && instance.status() === 'running') {
            return cancelPolling(stopPolling, instance);
          }
          return demoFlowService.checkStatusOnInstance(instance)
            .then(function (statusOK) {
              if (statusOK) {
                return cancelPolling(stopPolling, instance);
              }
            });
        }, 1000, timesToPoll);
      }

      function cancelPolling (stopPolling, instance) {
        $interval.cancel(stopPolling);
        loading('demoUrlPolling', false);
        demoFlowService.setItem('hasSeenHangTightMessage', instance.id());
      }
    }
  };
}
