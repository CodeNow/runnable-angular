'use strict';

require('app')
  .factory('watchOncePromise', function watchOncePromise(
    $q
  ) {
    var unWatch;
    return function ($scope, watchMe, returnWhen) {
      return $q(function (resolve) {
        function whenTrue(n) {

          console.log('watchMe', watchMe, n);
          if (n) {
            unWatch();
            resolve(n);
          }
        }
        function whenFalse(n) {
          if (!n) {
            unWatch();
            resolve(n);
          }
        }
        unWatch = $scope.$watch(watchMe, returnWhen ? whenTrue : whenFalse);
      });
    };
  });
