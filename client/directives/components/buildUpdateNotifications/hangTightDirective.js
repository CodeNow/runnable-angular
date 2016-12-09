'use strict';

require('app')
  .directive('hangTight', hangTight);

function hangTight(
  $interval,
  demoFlowService,
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'firstBuildNotificationView',
    scope: {
      instance: '=',
      demoFlowFlags: '='
    },
    link: function ($scope) {
      var instance = $scope.instance;
      var demoFlowFlags = $scope.demoFlowFlags;

      var stopWatchingForRunningInstance = $scope.$watch(function () {
        return instance.status() === 'running';
      }, function () {
        if (keypather.get(instance, 'contextVersion.getMainAppCodeVersion()') &&
           !demoFlowService.hasSeenUrlCallout()) {
            stopWatchingForRunningInstance();
            pollContainerUrl(instance);
        }
      });

      function pollContainerUrl (instance) {
        var timesToPoll = 15;
        var stopPolling = $interval(function (timesToPoll) {
          // zero indexed, once we've polled 15 times just go to add branch
          if (timesToPoll === 14 && instance.status() === 'running') {
            demoFlowService.setItem('hasSeenUrlCallout', instance.id());
            return cancelPolling(stopPolling, instance);
          }
          return demoFlowService.checkStatusOnInstance(instance)
            .then(function (statusOK) {
              if (statusOK) {
                demoFlowFlags.showUrlCallout = true;
                return cancelPolling(stopPolling, instance);
              }
            });
        }, 1000, timesToPoll);
      }

      function cancelPolling (stopPolling, instance) {
        $interval.cancel(stopPolling);
        demoFlowFlags.showHangTightMessage = false;
        demoFlowService.setItem('hasSeenHangTightMessage', instance.id());
      }
    }
  };
}
