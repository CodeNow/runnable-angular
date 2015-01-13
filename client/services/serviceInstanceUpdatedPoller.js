'use strict';

require('app')
  .factory('instanceUpdatedPoller', instanceUpdatedPoller);

function instanceUpdatedPoller(
  errs,
  $interval,
  $rootScope
) {
  var interval;
  return {
    start: function (instance) {
      $interval.cancel(interval);
      interval = $interval(function() {
        instance.hasNewBuild(function(err, newVersion) {
          if (err) {
            $interval.cancel(interval);
            return errs.handler(err);
          }
          if (newVersion) {
            $rootScope.$broadcast('new-build');
          }
        });
      }, 5 * 1000);
    },
    stop: function() {
      $interval.cancel(interval);
    }
  };
}