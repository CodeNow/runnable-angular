require('app')
  .directive('repoList', repoList);
/**
 * @ngInject
 */
function repoList (
  $rootScope,
  $state,
  $stateParams,
  async,
  QueryAssist,
  keypather,
  pick,
  hasKeypaths
) {
  return {
    restrict: 'E',
    scope: {
      instance: '=',
      build: '=',
      edit: '=',
      showGuide: '='
    },
    templateUrl: 'viewRepoList',
    replace: true,
    link: function ($scope, elem) {
      var build;

      var data = $scope.data = {};
      data.popoverRepoActions  = {
        actions: {
          deleteRepo: function (repo) {
            // repo is actually acv
            repo.destroy(function (err) {
              // safeApply should happen before throw, bc error reverts state
              $rootScope.safeApply();
              if (err) throw err;
            });
          },
          selectLatestCommitForRepo: function (repo) {
            // repo is actually acv
            repo.update({
              repo: repo.attrs.repo,
              branch: repo.attrs.branch,
              commit: repo.attrs.commits[0].sha //latest
            }, function (err) {
              $scope.safeApply();
              if (err) { throw err; }
            });
          }
        }
      };
      $scope.$watch('data.show', function (n) {
        // when add repo popover is shown, reset filter
        if (n) {
          keypather.set(data, 'state.toggleFilter', false);
          keypather.set(data, 'state.repoFilter', '');
        }
      });

      // TODO: Should be populated with what to do on new branch/commit select
      data.showUpdateButton = false;

      $scope.actions =  {
        selectBranch: function (acv, branchName) {
          var activeBranch = setActiveBranch(acv, branchName);
          fetchCommitsForBranch(acv, activeBranch);
        },
        fetchCommitsForBranch: fetchCommitsForBranch,
        fetchBranchesForRepo: fetchBranchesForRepo,
        resetSelectedBranch: resetSelectedBranch,
        addRepo: function (githubRepo) {
          $rootScope.$broadcast('app-document-click');
          var tempAcv = data.version.newAppCodeVersion({
            repo  : githubRepo.attrs.full_name,
            branch: githubRepo.attrs.default_branch
          });
          tempAcv.githubRepo.reset(githubRepo.json());
          var defaultBranch = tempAcv.githubRepo.newBranch(githubRepo.attrs.default_branch);
          setActiveBranch(tempAcv, defaultBranch);
          async.series([
            fetchCommits,
            createAppCodeVersion
          ], function (err) {
            $rootScope.safeApply();
            if (err) { throw err; }
          });
          function fetchCommits (cb) {
            // fetchCommits also sets tempAcv.attrs.commit to the latest commit
            // if it does not exist
            fetchCommitsForBranch(tempAcv, defaultBranch, function (err) {
              $rootScope.safeApply();
              cb(err);
            });
            $rootScope.safeApply();
          }
          function createAppCodeVersion (cb) {
            var body = pick(tempAcv.json(), ['repo', 'branch', 'commit']); // commit was set to latest above
            // appCodeVersion.githubRepo will match tempAcv.githubRepo bc of cache,
            // so githubRepo.state.activeBranch.state.activeCommit will all be set.
            data.version.appCodeVersions.create(body, function (err) {
              $rootScope.safeApply();
              cb(err);
            });
            $rootScope.safeApply();
          }
        }
      };

      // returns currently selected commit if user has selected a new commit but
      // change hasn't been saved with API yet
      $scope.actions.fetchRepoDisplayActiveCommit = function (repo) {
        return keypather.get(repo, 'state.activeCommit') || repo.attrs.activeCommit;
      };

      // triggered when update button pressed for multiple repos,
      // or when selected commit changes if single repo
      $scope.actions.triggerInstanceUpdateOnRepoCommitChange = triggerInstanceUpdateOnRepoCommitChange;

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
          updateInstanceWithBuild,
          reloadController
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
          }, function (err) {
            cb(err, build);
          });
        }

        function reloadController (build, cb) {
          cb();
          var current = $state.current;
          var params = angular.copy($stateParams);
          $state.transitionTo(current, params, { reload: true, inherit: true, notify: true });
        }
      }

      if (!$scope.edit) {
        // we are on instance page, not instanceEdit

        // invoked via ng-click in list of commits from this branch (viewInstancePopoverCommitSelect)
        $scope.actions.selectActiveBranchAndCommit = function (repo, commit) {
          keypather.set(repo, 'state.activeCommit', commit);
          keypather.set(repo, 'state.show', false); // hide commit select dropdown
          // is this the only repo?
          if ($scope.build.contextVersions.models[0].appCodeVersions.models.length > 1) {
            // don't fire. Requires explicit update action from user
            data.showUpdateButton = true;
          } else {
            // fire away chief
            triggerInstanceUpdateOnRepoCommitChange();
          }
        };

      } else {
        // instanceEdit page

        // invoked via ng-click in list of commits from this branch (viewInstancePopoverCommitSelect)
        $scope.actions.selectActiveBranchAndCommit = function (acv, selectedBranch, selectedCommit) {
          keypather.set(acv, 'state.show', false); // hide commit select dropdown
          var lastActiveCommit = acv.githubRepo.state.activeBranch.state.activeCommit;
          // assume success
          setActiveBranch(acv, selectedBranch);
          acv.update({
            repo: acv.attrs.repo,
            branch: selectedBranch.attrs.name,
            commit: selectedCommit.attrs.sha
          }, function (err) {
            if (err) {
              // revert on failure
              setActiveCommit(selectedBranch, lastActiveCommit);
              throw err;
            }
            $rootScope.safeApply();
          });
          $rootScope.safeApply();
        };
      }

      // Set State Helpers

      // set active commit and state (commitsBehind)
      function setActiveCommit (activeBranch, activeCommit) {
        activeBranch.state.activeCommit = activeCommit;
        activeCommit.state = {};
        activeCommit.state.commitsBehind = activeBranch.commits.indexOf(activeCommit);
        if (!~activeCommit.state.commitsBehind) {
          activeCommit.state.commitsBehind = '?';
        }
      }
      // set active branch and state (commitsBehind)
      //
      function setActiveBranchByName (acv, activeBranchName) {
        var activeBranch = acv.githubRepo.newBranch(activeBranchName);
        setActiveBranch(acv, activeBranch);
        return activeBranch;
      }

      function setActiveBranch (acv, activeBranch) {
        var githubRepo = acv.githubRepo;
        // selected branch
        keypather.set(acv.githubRepo, 'state.selectedBranch', activeBranch);
        githubRepo.branches.add(activeBranch);
        // reset githubRepo state
        githubRepo.state = { activeBranch: activeBranch };
        // reset branch state
        activeBranch.state = {};
        $rootScope.safeApply();
        return activeBranch;
      }

      function resetSelectedBranch (githubRepo) {
        githubRepo.state.selectedBranch = githubRepo.state.activeBranch;
      }

      // Fetch Helpers

      function fetchCommitsForBranch (appCodeVersion, activeBranch, cb) {
        cb = cb || function () {};
        activeBranch.commits.fetch(function (err) {
          if (err) {
            $rootScope.safeApply();
            return cb(err);
          }
          if (!appCodeVersion.attrs.commit) { // set to latest
            var latestCommit = activeBranch.commits.models[0];
            appCodeVersion.extend({
              commit: latestCommit.attrs.sha
            });
          }
          // active commit
          var activeCommit =
            activeBranch.commits.find(
              hasKeypaths({ 'attrs.sha': appCodeVersion.attrs.commit }));
          // rest branch state
          setActiveBranch(appCodeVersion, activeBranch);
          // reset commit state
          setActiveCommit(activeBranch, activeCommit);
          $rootScope.safeApply();
          cb();
        });
      }

      function fetchBranchesForRepo (githubRepo, cb) {
        cb = cb || function () {};
        githubRepo.branches.fetch(function (err) {
          $rootScope.safeApply();
          cb(err);
        });
      }

      // Initial Page load functions

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
          fetchVersion,
          setupActiveBranches,
          fetchCommits
        ], cb);
        function fetchVersion (callback) {
          data.version.fetch(function (err) {
            $rootScope.safeApply();
            callback(err);
          });
          $rootScope.safeApply();
        }
        function setupActiveBranches (callback) {
          // active branches - not async just creates branch models
          data.version.appCodeVersions.forEach(function (appCodeVersion) {
            setActiveBranchByName(appCodeVersion, appCodeVersion.attrs.branch);
          });
          callback();
        }
        function fetchCommits (callback) {
          // fetch all commits for branch and set activeCommit state
          async.each(data.version.appCodeVersions.models,
            function (appCodeVersion, cb) {
              var activeBranch = appCodeVersion.githubRepo.state.activeBranch;
              fetchCommitsForBranch(appCodeVersion, activeBranch, function (err) {
                if (err) { return cb(err); } // FIXME: handle branch 404 error
                $rootScope.safeApply();
                cb();
              });
            }, callback);
        }
      }

      function populateAppCodeVersion (acv, cb) {
        async.series([
          setupActiveBranches,
          fetchCommits
        ], cb);
        function setupActiveBranches (callback) {
          // active branches - not async just creates branch models
          data.version.appCodeVersions.forEach(function (appCodeVersion) {
            setActiveBranchByName(appCodeVersion, appCodeVersion.attrs.branch);
          });
          callback();
        }
        function fetchCommits (callback) {
          // fetch all commits for branch and set activeCommit state
          async.each(data.version.appCodeVersions.models,
            function (appCodeVersion, cb) {
              var activeBranch = appCodeVersion.githubRepo.state.activeBranch;
              fetchCommitsForBranch(appCodeVersion, activeBranch, function (err) {
                if (err) { return cb(err); } // FIXME: handle branch 404 error
                $rootScope.safeApply();
                cb();
              });
            }, callback);
        }
      }

      $scope.$watch('build.contextVersions.models[0].id()', function (n) {
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
