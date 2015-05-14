'use strict';

require('app')
  .factory('watchWhenTruthyPromise', function watchWhenTruthyPromise(
    $q
  ) {
    return function ($scope, watchMe) {
      var defer = $q.defer();
      var unWatch = $scope.$watch(watchMe, function (n) {
        if (n) {
          unWatch();
          defer.resolve(n);
        }
      });
      return defer.promise;
    };
  });
