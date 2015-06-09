'use strict';

require('app')
  .factory('loading', loading);

function loading(
  $rootScope,
  exists
) {
  $rootScope.isLoading = {};
  var loadingStatusHash = {};

  var loadingFunc = function (namespace, startLoading) {
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
    $rootScope.isLoading[namespace] = loadingStatusHash[namespace] > 0;
  };
  loadingFunc.reset = function (namespace) {
    loadingStatusHash[namespace] = 0;
  };
  return loadingFunc;
}
