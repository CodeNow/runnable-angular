'use strict';

require('app')
  .directive('webView', webView);

/**
 * @ngInject
 */
function webView(
  async,
  keypather,
  $timeout,
  $sce,
  $stateParams,
  pFetchInstances
) {
  return {
    restrict: 'A',
    templateUrl: 'viewWebView',
    scope: {},
    link: function ($scope, elem) {

      pFetchInstances({
        name: $stateParams.instanceName
      })
      .then(function(instance) {
        $scope.instance = instance;
        $scope.data.iframeUrl = $sce.trustAsResourceUrl($scope.instance.containers.models[0].urls()[0]);
      });

      var iframe = elem.find('iframe')[0];
      var data = $scope.data = {};
      var actions = $scope.actions = {};

      // reload web view when container restarts or is renamed
      $scope.$watch('instance.containers.models[0].attrs.inspect.State.StartedAt', function (val) {
        if (!val) { return; }
        $scope.actions.refresh();
      });
      $scope.$watch('instance.attrs.name', function (val) {
        if (!val) { return; }

        var urlString = keypather.get($scope, 'data.iframeUrl.toString()');
        if (urlString) {
          var subdomain = urlString.match(/http:\/\/([^.]*)/);
          if (subdomain && subdomain[1] === val.toLowerCase()) { return; }
        }

        $scope.data.iframeUrl = $sce.trustAsResourceUrl('about:blank');
        $timeout(function () {
          $scope.data.iframeUrl = $sce.trustAsResourceUrl($scope.instance.containers.models[0].urls()[0]);
        });
      });

      $scope.actions.refresh = function () {
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
      };
    }
  };
}
