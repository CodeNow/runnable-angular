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
      // Should be populated with what to do on new branch/commit select
      $scope.actions = {};

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
                async.parallel([
                  function (cb) {
                    model.fetchBranchCommits(function (err, commits) {
                      if (err) { return cb(err); }

                      model.attrs.commits = commits;
                      model.attrs.activeCommit = commits.filter(function (commit) {
                        return commit.sha === model.attrs.commit;
                      })[0];

                      if (model.attrs.activeCommit !== commits[0]) {
                        // We're behind
                        model.attrs.commitsBehind = commits.indexOf(model.attrs.activeCommit);
                      }
                      cb();
                    });
                  },
                  function (cb) {
                    model.githubRepo().fetchBranches(function (err, branches) {
                      if (err) {
                        cb(err);
                      }
                      model.attrs.branches = branches;
                      cb();
                    });
                  }
                ], cb);
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