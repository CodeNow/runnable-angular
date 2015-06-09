'use strict';

require('app')
  .directive('repoList', repoList);

function repoList(
  eventTracking,
  promisify,
  $localStorage,
  loading,
  errs
) {
  return {
    restrict: 'A',
    templateUrl: 'viewRepoList',
    scope: {
      instance: '='
    },
    link: function ($scope) {
      $scope.$storage = $localStorage.$default({
        repoListIsClosed: false
      });

      // add-repo-popover
      // Object to pass reference instead of value
      // into child directive
      $scope.data = {
        show: false
      };

      // selected repo commit change
      $scope.$on('change-commit', function (event, commitSha) {
        // track event w/ mixpanel
        eventTracking.toggledCommit({triggeredBuild: true});


        loading('main', true);

        /*
          1. Clone the build
          2. Fetch the context version
          3. Find the matching ACV and update it in the new context version
          4. Build the build
          5. Update instance w/ Build
         */

        return promisify($scope.instance.build, 'deepCopy')() // 1. Clone the build
          .then(function (build) {
            // Nested because we need the build var lower down the chain
            return promisify(build.contextVersions.models[0], 'fetch')() // 2. Fetch context version
              .then(function (contextVersion) {
                var mainAcv = contextVersion.getMainAppCodeVersion(); // 3. Find matching ACV
                return promisify(mainAcv, 'update')({
                  commit: commitSha
                }); // Update ACV
              })
              .then(function () {
                return promisify(build, 'build')({ // 4. Build the build
                  message: 'Update application code version(s)'
                });
              });
          })
          .then(function (updatedBuild) { // 5. Update instance w/ Build
            return promisify($scope.instance, 'update')({
              build: updatedBuild.id()
            });
          })
          .catch(errs.handler)
          .finally(function () {
            loading('main', false);
          });
      });

      $scope.$watch('instance.attrs.locked', function (n) {
        $scope.instance.update({
          locked: n
        }, angular.noop);
      });
    }
  };
}
