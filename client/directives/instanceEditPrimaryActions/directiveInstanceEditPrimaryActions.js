'use strict';

require('app')
  .directive('instanceEditPrimaryActions', instanceEditPrimaryActions);
/**
 * @ngInject
 */
function instanceEditPrimaryActions(
  $state,
  errs,
  $stateParams,
  keypather,
  promisify,
  fetchBuild
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstanceEditPrimaryActions',
    scope: {
      user: '=',
      instance: '=',
      loading: '=',
      openItems: '='
    },
    link: function ($scope, elem, attrs) {
      // prevent multiple clicks
      var building = false;
      $scope.build = function (noCache) {
        if (building) { return; }
        building = true;
        $scope.loading = true;
        var unwatch = $scope.$watch('openItems.isClean()', function (n) {
          if (!n) { return; }
          unwatch();
          var buildObj = {
            message: 'Manual build',
            noCache: noCache
          };
          fetchNewBuild().then(function (build) {
            var unwatch = $scope.$watch(function () {
              return keypather.get(build, 'state.dirty');
            }, function (n) {
              if (n) { return; } //state.dirty === 0 is when everything is clean
              unwatch();
              promisify(build, 'build')(
                buildObj
              ).then(function (build) {
                var opts = {
                  build: build.id()
                };
                if ($scope.instance.state && $scope.instance.state.env) {
                  opts.env = $scope.instance.state.env;
                }
                return promisify($scope.instance, 'update')(opts);
              }).then(function () {
                $state.go('instance.instance', $stateParams);
              }).catch(handleError);
            });
          });
        });
      };

      $scope.popoverBuildOptions = {
        data: {},
        actions: {
          noCacheBuild: function () {
            $scope.popoverBuildOptions.data.show = false;
            $scope.build(true);
          }
        }
      };

      function fetchNewBuild() {
        return fetchBuild($stateParams.buildId)
          .then(function(build) {
            $scope.newBuild = build;
            return build;
          });
      }
      function handleError(err) {
        if (err) {
          $scope.loading = false;
          errs.handler(err);
        }
      }
    }
  };
}
