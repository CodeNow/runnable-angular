require('app')
  .directive('repoList', repoList);
/**
 * @ngInject
 */
function repoList (
  $rootScope,
  async
) {
  return {
    restrict: 'E',
    scope: {
      build: '='
    },
    templateUrl: 'viewRepoList',
    replace: true,
    link: function ($scope, elem) {
      $scope.$watch('build.contextVersions.models[0]', function (n) {
        if (n) {
          async.series([
            function (cb) {
              $scope.build.contextVersions.models[0].fetch(cb);
            },
            function (cb) {
              $rootScope.safeApply();
              var acvs = $scope.acvs = n.appCodeVersions.models;
              async.each(acvs, function (model, cb) {
                var commits = model.fetchBranchCommits(function (err, commits) {
                  if (err) { return cb(err); }
                  model.attrs.commits = commits;
                  cb();
                });
              }, cb);
            }
          ], function (err) {
            if (err) {
              throw err;
            }
            $rootScope.safeApply();
          });
        }
      });

      // On branch change, update ACV commits
    }
  };
}