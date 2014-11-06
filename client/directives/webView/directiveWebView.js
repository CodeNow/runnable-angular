require('app')
  .directive('webView', webView);

/**
 * @ngInject
 */
function webView(
  async,
  keypather,
  QueryAssist,
  $rootScope,
  $sce,
  $stateParams,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewWebView',
    replace: true,
    scope: {},
    link: function ($scope, elem) {

      async.series([
        fetchUser,
        fetchInstance
      ], function () {
        $scope.data.iframeUrl = $sce.trustAsResourceUrl($scope.instance.containers.models[0].urls()[0]);
      });

      function fetchUser(cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {})
          .go();
      }

      function fetchInstance(cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchInstances')
          .query({
            githubUsername: $stateParams.userName,
            name: $stateParams.instanceName
          })
          .cacheFetch(function (instances, cached, cb) {
            if (!cached && !instances.models.length) {
              return cb(new Error('Instance not found'));
            }
            var instance = instances.models[0];
            $scope.instance = instance;
            $rootScope.safeApply();
          })
          .resolve(function (err, instances, cb) {
            var instance = instances.models[0];
            if (!keypather.get(instance, 'containers.models') || !instance.containers.models.length) {
              return cb(new Error('instance has no containers'));
            }
            $rootScope.safeApply();
            cb(err);
          })
          .go();
      }

      var iframe = elem.find('iframe')[0];
      var data = $scope.data = {};
      var actions = $scope.actions = {};

      // reload web view when container restarts
      $scope.$watch('instance.containers.models[0].attrs.inspect.State.StartedAt', function (val) {
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
        if (!$scope.data.iframeUrl || !$scope.data.iframeUrl.toString) {
          /**
           * will be undefined if container exposes no ports, and has no urls
           */
          return;
        }
        var oldURL = $scope.data.iframeUrl.toString();
        $scope.data.iframeUrl = $sce.trustAsResourceUrl('about:blank');
        $rootScope.safeApply(function () {
          $scope.data.iframeUrl = $sce.trustAsResourceUrl(oldURL);
        });
      };
    }
  };
}
