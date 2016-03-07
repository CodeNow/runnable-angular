'use strict';


require('app')
  .factory('watchOncePromise', function watchOncePromise(
    $q
  ) {
    return function ($scope, watchMe, returnWhen) {
      var returnWhenUndefined = returnWhen === undefined;
      return $q(function (resolve) {
        var unWatch = $scope.$watch(watchMe, function watchWhen(n) {
          // Convert both values to bools before we check.
          // Unless we're looking for an undefined value
          var normalized = returnWhenUndefined ? n : !!n;
          if (returnWhen === normalized) {
            unWatch();
            resolve(n);
          }
        });
      });
    };
  });

require('app')
  .service('WatchOnlyOnce', function WatchOnlyOnce(
    $q
  ) {
    return function ($scope) {
      var unWatch = null;
      this.watchPromise = function (watchMe, returnWhen) {
        var returnWhenUndefined = returnWhen === undefined;
        if (unWatch) {
          unWatch();
        }
        return $q(function (resolve) {
          unWatch = $scope.$watch(watchMe, function watchWhen(n) {
            // Convert both values to bools before we check.
            // Unless we're looking for an undefined value
            var normalized = returnWhenUndefined ? n : !!n;
            if (returnWhen === normalized) {
              unWatch();
              resolve(n);
            }
          });
          return unWatch;
        });
      };
    };
  });