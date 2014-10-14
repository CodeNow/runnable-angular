require('app')
  .directive('webView', webView);

/**
 * @ngInject
 */
function webView (
  $sce,
  $rootScope
) {
  return {
    restrict: 'E',
    templateUrl: 'viewWebView',
    replace: true,
    scope: {
      container: '='
    },
    link: function ($scope, elem) {
      var iframe = elem.find('iframe')[0];
      var data = $scope.data = {};
      var actions = $scope.actions = {};
      $scope.data.iframeUrl = $sce.trustAsResourceUrl($scope.container.urls()[0]);

      // reload web view when container restarts
      $scope.$watch('container.attrs.inspect.State.StartedAt', function (val) {
        if (!val) return;
        $scope.actions.refresh();
      });

      $scope.actions.forward = function () {
        iframe.contentWindow.history.forward();
      };

      $scope.actions.back = function () {
        iframe.contentWindow.history.back();
      };

      $scope.actions.refresh = function () {
        if (!$scope.data.iframeUrl){
          /**
           * will be undefined if container exposes no ports, and has no urls
           */
          return;
        }
        var oldURL = $scope.data.iframeUrl.toString();
        $scope.data.iframeUrl = $sce.trustAsResourceUrl('about:blank');
        $rootScope.safeApply(function() {
          $scope.data.iframeUrl = $sce.trustAsResourceUrl(oldURL);
        });
      };
    }
  };
}
