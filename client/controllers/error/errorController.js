'use strict';

require('app')
  .controller('ErrorController', function ErrorController(
    $location,
    $scope,
    $state
  ) {
    $scope.err = $state.params.err;
    var locationSearch = $location.search();
    if (locationSearch.containerUrl) {
      $scope.containerUrl = locationSearch.containerUrl;
      $location.search('containerUrl', null);
    }
    if (locationSearch.redirectUrl) {
      $scope.redirectUrl = locationSearch.redirectUrl;
      $location.search('redirectUrl', null);
    }
    if (locationSearch.ownerName) {
      $scope.ownerName = locationSearch.ownerName;
      $location.search('ownerName', null);
    }
    if (locationSearch.instanceName) {
      $scope.instanceName = locationSearch.instanceName;
      $location.search('instanceName', null);
    }
    if (locationSearch.ports) {
      $scope.ports = JSON.parse(locationSearch.ports);
      $location.search('ports', null);
    }
  });
