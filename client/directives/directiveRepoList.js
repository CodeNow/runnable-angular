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

      function updateCommits(acv, cb) {
        if (!cb) {
          cb = angular.noop;
        }
        acv.attrs.commits = [];
        acv.fetchBranchCommits(function (err, commits) {
          if (err) { return cb(err); }

          acv.attrs.commits = commits;
          acv.attrs.activeCommit = commits.filter(function (commit) {
            return commit.sha === acv.attrs.commit;
          })[0];

          if (acv.attrs.activeCommit !== commits[0]) {
            // We're behind
            acv.attrs.commitsBehind = commits.indexOf(acv.attrs.activeCommit);
          }
          $rootScope.safeApply();
          cb();
        });
      }
      // Should be populated with what to do on new branch/commit select
      $scope.actions =  {
        updateRepos: updateCommits
      };

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
                    updateCommits(model, cb);
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