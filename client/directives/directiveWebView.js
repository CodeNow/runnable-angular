require('app')
  .directive('webView', webView);

/**
 * @ngInject
 */
function webView (

) {
  return {
    restrict: 'E',
    templateUrl: 'viewWebView',
    replace: true,
    scope: {
      container: '='
    },
    link: function ($scope, elem) {
      var iframe = elem.find('iframe');

      $scope.forward = function () {
        iframe.history.forward();
      };
      $scope.back = function () {
        iframe.history.back();
      };

      $scope.refresh = function () {
        $scope.iframeUrl = $sce.trustAsResourceUrl($scope.iframeUrl);
      };

      $scope.iframeUrl = $sce.trustAsResourceUrl($scope.containercontainer.urls()[0]);

    }
  };
}