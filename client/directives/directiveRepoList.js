require('app')
  .directive('repoList', repoList);
/**
 * @ngInject
 */
function repoList (
  $rootScope,
  async,
  QueryAssist
) {
  return {
    restrict: 'E',
    scope: {
      build: '='
    },
    templateUrl: 'viewRepoList',
    replace: true,
    link: function ($scope, elem) {
      var build;

      var data = $scope.data = {};
      // TODO: Should be populated with what to do on new branch/commit select
      $scope.actions =  {
        updateCommits: updateCommits,
        addRepo: function (repo) {
          var body = {
            repo: repo.attrs.full_name
          };
          repo.fetchBranches(function (err, branches) {
            if (err) {
              throw err;
            }
            if (!branches.length) {
              throw new Error('Branches not found');
            }
            var defaultBranch = branches.filter(function (branch) {
              return branch.name === repo.attrs.default_branch;
            })[0];
            body.branch = defaultBranch.name;
            body.commit = defaultBranch.commit.sha;
            data.version.createAppCodeVersion(body, function() {
              data.version.fetch(function(err, version) {
                populateContextVersions(function () {
                  $rootScope.safeApply();
                });
              });
            });
          });
        }
      };

      // On branch change, update ACV commits
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
          if (!commits[commits.length - 1].parents.length) {
            acv.attrs.allCommitsLoaded = true;
          }

          $rootScope.safeApply();
          cb();
        });
      }

      function fetchOwnerRepos(cb) {
        var thisUser = $rootScope.dataApp.user;
        var query;
        if (thisUser.isOwnerOf($scope.build)) {
          $scope.data.selectedRepos = $scope.data.selectedRepos || thisUser.newGithubRepos([], {
            noStore: true
          });
          query = new QueryAssist(thisUser, cb)
            .wrapFunc('fetchGithubRepos');
        } else {
          var githubOrg = thisUser.newGithubOrg($rootScope.dataApp.stateParams.userName);
          $scope.data.selectedRepos = $scope.data.selectedRepos || githubOrg.newRepos([], {
            noStore: true
          });
          query = new QueryAssist(githubOrg, cb)
            .wrapFunc('fetchRepos');
        }
        query
          .query({})
          .cacheFetch(function updateDom(githubRepos, cached, cb) {
            $scope.data.githubRepos = githubRepos;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, githubRepos, cb) {
            if (githubRepos) {
              return cb(new Error('GitHub repos not found'));
            }
            $rootScope.safeApply();
            cb(err);
          })
          .go();
      }

      function populateContextVersions (cb) {
        async.series([
            function (cb) {
              data.version.fetch(cb);
            },
            function (cb) {
              $rootScope.safeApply();

              async.each(data.version.appCodeVersions.models, function (model, cb) {

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
          ], cb);
      }

      $scope.$watch('build.contextVersions.models[0]', function (n) {
        if (n) {
          data.build = $scope.build;
          data.version = $scope.build.contextVersions.models[0];
          async.parallel([
            fetchOwnerRepos,
            populateContextVersions
          ], function (err) {
            if (err) {
              throw err;
            }
            $rootScope.safeApply();
          });
        }
      });
    }
  };
}