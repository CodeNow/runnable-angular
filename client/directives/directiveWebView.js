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

      $scope.actions.forward = function () {
        iframe.contentWindow.history.forward();
      };
      $scope.actions.back = function () {
        iframe.contentWindow.history.back();
      };

      $scope.actions.refresh = function () {
        $scope.data.iframeUrl = $sce.trustAsResourceUrl('about:blank');
        $rootScope.safeApply(function() {
          $scope.data.iframeUrl = $sce.trustAsResourceUrl($scope.data.iframeUrl);
        });
      };
    }
  };
}
