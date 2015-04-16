'use strict';

require('app')
  .directive('webView', webView);

/**
 * @ngInject
 */
function webView(
  keypather,
  $timeout,
  $sce,
  $stateParams,
  fetchInstances,
  configUserContentDomain
) {
  return {
    restrict: 'A',
    templateUrl: 'viewWebView',
    scope: {},
    link: function ($scope, elem) {

      fetchInstances({
        name: $stateParams.instanceName
      })
      .then(function(instance) {
        $scope.instance = instance;
        $scope.data.iframeUrl = $sce.trustAsResourceUrl($scope.instance.containers.models[0].urls(configUserContentDomain)[0]);
      });

      var data = $scope.data = {};

      function refresh () {
        if (!$scope.data.iframeUrl || !$scope.data.iframeUrl.toString) {
          /**
           * will be undefined if container exposes no ports, and has no urls
           */
          return;
        }
        var oldURL = $scope.data.iframeUrl.toString();
        $scope.data.iframeUrl = $sce.trustAsResourceUrl('about:blank');
        $timeout(function () {
          $scope.data.iframeUrl = $sce.trustAsResourceUrl(oldURL);
        });
      }

      // reload web view when container restarts or is renamed
      $scope.$watch('instance.containers.models[0].attrs.inspect.State.StartedAt', function (val) {
        if (!val) { return; }
        refresh();
      });
      $scope.$watch('instance.attrs.name', function (val) {
        if (!val) { return; }

        var urlString = keypather.get($scope, 'data.iframeUrl.toString()');
        if (urlString) {
          var subdomain = urlString.match(/http:\/\/([^.]*)/);
          var ownerName = $scope.instance.attrs.owner.username;
          if (subdomain && subdomain[1] === (val + '-' + ownerName).toLowerCase()) { return; }
        }

        // Setting the iframeUrl to the same url results in no change, and no refresh
        // We set it to about:blank for one digest cycle to trigger the refresh
        $scope.data.iframeUrl = $sce.trustAsResourceUrl('about:blank');
        $timeout(function () {
          $scope.data.iframeUrl = $sce.trustAsResourceUrl($scope.instance.containers.models[0].urls(configUserContentDomain)[0]);
        });
      });

    }
  };
}
