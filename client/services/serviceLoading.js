'use strict';

require('app')
  .factory('loading', loading);

function loading(
  $timeout,
  $rootScope,
  exists
) {
  $rootScope.isLoading = {};
  var loadingStatusHash = {};
  var timeoutTime = 0;
  $timeout(function () {
    timeoutTime = 100;
  }, 5000);

  return function (namespace, startLoading) {
    if (!exists(loadingStatusHash[namespace])) {
      loadingStatusHash[namespace] = 0;
    }
    if (startLoading) {
      loadingStatusHash[namespace] += 1;
    } else {
      loadingStatusHash[namespace] -= 1;
      if(loadingStatusHash[namespace] < 0){
        loadingStatusHash[namespace] = 0;
      }
    }

    if (loadingStatusHash[namespace] > 0) {
      $timeout(function () {
        if (loadingStatusHash[namespace] > 0) {
          $rootScope.isLoading[namespace] = true;
        }
      }, timeoutTime);
    } else {
      $rootScope.isLoading[namespace] = false;
    }
  };
}
