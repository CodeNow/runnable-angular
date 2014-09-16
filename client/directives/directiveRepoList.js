require('app')
  .directive('repoList', repoList);
/**
 * @ngInject
 */
function repoList (
  $rootScope,
  $state,
  async,
  QueryAssist,
  keypather,
  pick
) {
  return {
    restrict: 'E',
    scope: {
      instance: '=',
      build: '=',
      edit: '='
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

      // returns currently selected commit if user has selected a new commit but
      // change hasn't been saved with API yet
      $scope.actions.fetchRepoDisplayActiveCommit = function (repo) {
        return keypather.get(repo, 'state.activeCommit') || repo.attrs.activeCommit;
      };

      // triggered when update button pressed for multiple repos,
      // or when selected commit changes if single repo
      function triggerInstanceUpdateOnRepoCommitChange () {
        $rootScope.dataApp.data.loading = true;
        var context              = $scope.build.contexts.models[0];
        var contextVersion       = $scope.build.contextVersions.models[0];
        var infraCodeVersionId   = contextVersion.attrs.infraCodeVersion;

        // fetches current state of repos listed in DOM w/ selected commits
        var appCodeVersionStates = contextVersion.appCodeVersions.models.map(function (model) {
          return {
            branch: model.attrs.branch,
            repo: model.attrs.repo,
            commit: $scope.actions.fetchRepoDisplayActiveCommit(model).sha
          };
        });

        async.waterfall([
          findOrCreateContextVersion,
          createBuild,
          buildBuild,
          updateInstanceWithBuild
        ], function () {
          $rootScope.dataApp.data.loading = false;
          $state.go('instance.instance');
        });

        // if we find this contextVersion, reuse it.
        // otherwise create a new one
        function findOrCreateContextVersion (cb) {
          var foundCVs = context.fetchVersions({
            infraCodeVersion: infraCodeVersionId,
            appCodeVersions: appCodeVersionStates
          }, function (err) {
            if (err) {
              return cb(err);
            }
            if (foundCVs.models.length) {
              return cb(null, foundCVs.models[0]);
            }
            var body = {
              infraCodeVersion: infraCodeVersionId
              //appCodeVersions: appCodeVersionStates
            };
            var newContextVersion = context.createVersion(body, function (err) {
              async.each(appCodeVersionStates, function (acvs, cb) {
                newContextVersion.appCodeVersions.create(acvs, cb);
              }, function (err) {
                cb(err, newContextVersion);
              });
            });
          });
        }

        function createBuild (contextVersion, cb) {
          var build = $rootScope.dataApp.user.createBuild({
            contextVersions: [contextVersion.id()],
            owner: $scope.instance.attrs.owner
          }, function (err) {
            cb(err, build);
          });
        }

        function buildBuild (build, cb) {
          build.build({
            message: 'change appCodeVersion TODO change'
          }, function (err) {
            cb(err, build);
          });
        }

        function updateInstanceWithBuild (build, cb) {
          $scope.instance.update({
            build: build.id()
          }, cb);
        }
      }

      if (!$scope.edit) {
        // we are on instance page, not instanceEdit

        // invoked via ng-click in list of commits from this branch (viewInstancePopoverCommitSelect)
        $scope.actions.selectActiveCommit = function (repo, commit) {
          keypather.set(repo, 'state.activeCommit', commit);
          keypather.set(repo, 'state.show', false); // hide commit select dropdown
          // is this the only repo?
          if ($scope.build.contextVersions.models[0].appCodeVersions.models.length > 1) {
            // don't fire. Requires explicit update action from user
          } else {
            // fire away chief
            triggerInstanceUpdateOnRepoCommitChange();
          }
        };

      } else {
        // instanceEdit page

        // invoked via ng-click in list of commits from this branch (viewInstancePopoverCommitSelect)
        $scope.actions.selectActiveCommit = function (repo, commit) {};
      }

      // On branch change, update ACV commits
      function updateCommits(acv, cb) {
        if (!cb) {
          cb = angular.noop;
        }
        acv.attrs.commits = [];
        acv.fetchBranchCommits(function (err, commits) {
          if (err) { return cb(err); }

          acv.attrs.commits = commits;
          acv.attrs.activeCommit = commits.find(function (commit) {
            return commit.sha === acv.attrs.commit;
          });

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
