'use strict';

require('app')
  .factory('watchOncePromise', function watchOncePromise(
    $q
  ) {
    var unWatch;
    return function ($scope, watchMe, returnWhen) {
      var returnWhenCheck = !!returnWhen;
      return $q(function (resolve) {
        unWatch = $scope.$watch(watchMe, function watchWhen(n) {
          var normalized = !!n;
          if (returnWhenCheck === normalized) {
            unWatch();
            resolve(n);
          }
        });
      });
    };
  });
