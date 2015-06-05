'use strict';

require('app')
  .factory('watchWhenTruthyPromise', function watchWhenTruthyPromise(
    $q
  ) {
    return function ($scope, watchMe) {
      return $q(function (resolve) {
        var unWatch = $scope.$watch(watchMe, function (n) {
          if (n) {
            unWatch();
            resolve(n);
          }
        });
      });
    };
  })
  .factory('watchWhenFalsyPromise', function watchWhenFalsePromise(
    $q
  ) {
    return function ($scope, watchMe) {
      return $q(function (resolve) {
        var unWatch = $scope.$watch(watchMe, function (n) {
          if (!n) {
            unWatch();
            resolve(n);
          }
        });
      });
    };
  });
