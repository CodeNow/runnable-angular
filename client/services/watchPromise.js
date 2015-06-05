'use strict';

require('app')
  .factory('watchOncePromise', function watchOncePromise(
    $q
  ) {
    var unWatch;
    return function ($scope, watchMe, returnWhen) {
      var returnWhenUndefined = returnWhen === undefined;
      return $q(function (resolve) {
        unWatch = $scope.$watch(watchMe, function watchWhen(n) {
          // Convert both values to bools before we check.
          // Unless we're looking for an undefined value
          var normalized = returnWhenUndefined ? !!n : n;
          if (returnWhen === normalized) {
            unWatch();
            resolve(n);
          }
        });
      });
    };
  });
