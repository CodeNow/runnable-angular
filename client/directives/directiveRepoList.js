require('app')
  .directive('repoList', repoList);
/**
 * @ngInject
 */
function repoList (
  async,
  hasKeypaths,
  keypather,
  pick,
  QueryAssist,
  $rootScope,
  $state,
  $stateParams,
  user
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

      // fetch appCodeVersions (repos) for display
      switch ($state.$current.name) {
        case 'instance.instance':
          break;
        case 'instance.edit':
          break;
        case 'instance.setup':
          // fetch build
          initInstanceNew();
          break;
      }

      // display guide if no repos added
      $scope.showGuide = true;
      $scope.showUpdateButton = false;
      $scope.showAddRepoPopover = false;

      $scope.selectLatestCommit = function (acv) {
        var activeBranch = acv.githubRepo.state.activeBranch;
        // fetch latest
        fetchCommitsForBranch(acv, activeBranch, function (err) {
          if (err) throw err;
          var latestCommit = activeBranch.commits.models[0];
          setActiveCommit(acv, activeBranch, latestCommit);
          $scope.triggerInstanceUpdateOnRepoCommitChange();
        });
      };

      $scope.triggerInstanceUpdateOnRepoCommitChange = function () {
        $rootScope.dataApp.data.loading = true;
        var context              = $scope.build.contexts.models[0];
        var contextVersion       = $scope.build.contextVersions.models[0];
        var infraCodeVersionId   = contextVersion.attrs.infraCodeVersion;
        // fetches current state of repos listed in DOM w/ selected commits
        var appCodeVersionStates = contextVersion.appCodeVersions.models.map(function (acv) {
          var githubRepo = acv.githubRepo;
          var activeBranch = githubRepo.state.activeBranch;
          var activeCommit = activeBranch.state.activeCommit;
          return {
            repo:   acv.attrs.repo,
            branch: activeBranch.attrs.name,
            commit: activeCommit.attrs.sha
          };
        });
        async.waterfall([
          findOrCreateContextVersion,
          createBuild,
          buildBuild,
          updateInstanceWithBuild,
          reloadController
        ], function (err) {
          if (err) {
            // reset appCodeVersions state
            data.version.appCodeVersions.models.forEach(function (acv) {
              resetAppCodeVersionState(acv);
            });
            $rootScope.safeApply();
          }
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
            };
            var newContextVersion = context.createVersion(body, function (err) {
              async.each(appCodeVersionStates, function (acvState, cb) {
                newContextVersion.appCodeVersions.create(acvState, cb);
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
            message: 'Update application code version(s)' // TODO: better message
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
      };

      function initInstanceNew () {
        async.series([
          fetchUser,
          fetchBuild
        ]);
      }

      function fetchUser (cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {
          })
          .go();
      }

      function fetchBuild (cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchBuild')
          .query($stateParams.buildId)
          .cacheFetch(function (build, cached, cb) {
            $scope.build = build;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, build, cb) {
            if (err) throw err;
            $rootScope.safeApply();
            cb();
          })
          .go();
      }








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
          selectLatestCommitForRepo: function (acv, repoActionsData) {
            var githubRepo = acv.githubRepo;
            var activeBranch = githubRepo.state.activeBranch;
            var latestCommit = activeBranch.commits.models[0];
            repoActionsData.show = false;

            // fetch latest commits
            fetchCommitsForBranch(acv, activeBranch, function (err) {
              if (err) { throw err; }
              // update appCodeVersion
              acv.update({
                repo: acv.attrs.acv,
                branch: acv.attrs.branch,
                commit: latestCommit.attrs.sha //latest
              }, function (err) {
                $rootScope.safeApply();
                if (err) { throw err; }
              });
              // set active commit
              setActiveCommit(acv, activeBranch, latestCommit);
            });
            $rootScope.safeApply();
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
        selectBranch: function (acv, selectedBranch) {
          fetchCommitsForBranch(acv, selectedBranch, function (err) {
            $rootScope.safeApply();
            if (err) { throw err; }
          });
        },
        fetchCommitsForBranch: fetchCommitsForBranch,
        fetchBranchesForRepo: fetchBranchesForRepo,
        addRepo: function (githubRepo) {
          $rootScope.$broadcast('app-document-click');
          var tempAcv = data.version.newAppCodeVersion({
            repo  : githubRepo.attrs.full_name,
            branch: githubRepo.attrs.default_branch
          });
          tempAcv.githubRepo.reset(githubRepo.json());
          var defaultBranch = tempAcv.githubRepo.newBranch(githubRepo.attrs.default_branch);
          setActiveBranch(tempAcv, defaultBranch);
          var activeBranch = defaultBranch;
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
            fetchCommitsForBranch(tempAcv, activeBranch, function (err) {
              if (err) { cb(err); }
              // get latest commit
              var latestCommit = activeBranch.commits.models[0];
              tempAcv.extend({
                commit: latestCommit.attrs.sha
              });
              // set active commit to latest
              setActiveCommit(tempAcv, activeBranch, latestCommit);
              $rootScope.safeApply();
              cb();
            });
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
        var appCodeVersionStates = contextVersion.appCodeVersions.models.map(function (acv) {
          var githubRepo = acv.githubRepo;
          var activeBranch = githubRepo.state.activeBranch;
          var activeCommit = activeBranch.state.activeCommit;
          return {
            repo:   acv.attrs.repo,
            branch: activeBranch.attrs.name,
            commit: activeCommit.attrs.sha
          };
        });

        async.waterfall([
          findOrCreateContextVersion,
          createBuild,
          buildBuild,
          updateInstanceWithBuild,
          reloadController
        ], function (err) {
          if (err) {
            // reset appCodeVersions state
            data.version.appCodeVersions.models.forEach(function (acv) {
              resetAppCodeVersionState(acv);
            });
            $rootScope.safeApply();
          }
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
            };
            var newContextVersion = context.createVersion(body, function (err) {
              async.each(appCodeVersionStates, function (acvState, cb) {
                newContextVersion.appCodeVersions.create(acvState, cb);
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
            message: 'Update application code version(s)' // TODO: better message
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
        $scope.actions.selectActiveBranchAndCommit = function (acv, selectedBranch, selectedCommit) {
          keypather.set(acv, 'state.show', false); // hide commit select dropdown
          // do nothing if user selects currectly active commit
          if (selectedCommit === keypather.get(acv, 'githubRepo.state.selectedBranch.state.activeCommit')) {
            return;
          }
          setActiveBranch(acv, selectedBranch);
          setActiveCommit(acv, selectedBranch, selectedCommit);
          // is this the only repo?
          if (data.version.appCodeVersions.models.length > 1) {
            // don't fire. Requires explicit update action from user
            data.showUpdateButton = true;
          } else {
            // update active models
            triggerInstanceUpdateOnRepoCommitChange();
          }
        };

        $scope.actions.selectLatestCommit = function (acv) {
          var activeBranch = acv.githubRepo.state.activeBranch;
          // fetch latest
          fetchCommitsForBranch(acv, activeBranch, function (err) {
            if (err) { throw err; }
            var latestCommit = activeBranch.commits.models[0];
            setActiveCommit(acv, activeBranch, latestCommit);
            triggerInstanceUpdateOnRepoCommitChange();
          });
        };
      } else {
        // instanceEdit page

        // invoked via ng-click in list of commits from this branch (viewInstancePopoverCommitSelect)
        $scope.actions.selectActiveBranchAndCommit = function (acv, selectedBranch, selectedCommit, cb) {
          cb = cb || function (err) {
            if (err) { throw err; }
          };
          keypather.set(acv, 'state.show', false); // hide commit select dropdown
          // do nothing if user selects currectly active commit
          if (selectedCommit === keypather.get(acv, 'githubRepo.state.selectedBranch.state.activeCommit')) {
            return;
          }
          var lastActiveBranch = acv.githubRepo.state.activeBranch;
          var lastActiveCommit = lastActiveBranch.state.activeCommit;
          // assume success
          setActiveBranch(acv, selectedBranch);
          setActiveCommit(acv, selectedBranch, selectedCommit);
          acv.update({
            repo: acv.attrs.repo,
            branch: selectedBranch.attrs.name,
            commit: selectedCommit.attrs.sha
          }, function (err) {
            if (err) {
              // revert on failure
              setActiveBranch(acv, lastActiveBranch);
              setActiveCommit(acv, lastActiveBranch, lastActiveCommit);
              cb(err);
            }
            $rootScope.safeApply();
            cb();
          });
        };
      }



      // Set State Helpers

      // set active commit and state (commitsBehind)
      function setActiveCommit (acv, activeBranch, activeCommit, cb) {
        cb = cb || function(){};
        keypather.set(activeBranch, 'state.activeCommit', activeCommit);
        activeCommit.commitOffset(acv.attrs.branch, function (err, diff) {
          if (err) {
            // 404 could mean the commit doesnt exist on that branch anymore (git reset)
            // the view should show generic "update to latest" message if the
            // commitsBehind value is falsy
            keypather.set(activeCommit, 'state.commitsBehind', false);
          }
          else {
            keypather.set(activeCommit, 'state.commitsBehind', diff.behind_by);
          }
          $rootScope.safeApply();
          cb();
        });
      }
      // set active branch and state (commitsBehind)
      //
      function setActiveBranchByName (acv, activeBranchName) {
        var activeBranch = acv.githubRepo.newBranch(activeBranchName);
        setActiveBranch(acv, activeBranch);
        return activeBranch;
      }

      function resetAppCodeVersionState (acv) {
        var activeBranch = setActiveBranchByName(acv.attrs.branch);
        var activeCommit =
          activeBranch.commits.models.find(
            hasKeypaths({ 'attrs.sha': acv.attrs.commit }));
        setActiveCommit(acv, activeBranch, activeCommit);
      }

      function setActiveBranch (acv, activeBranch) {
        var githubRepo = acv.githubRepo;
        // selected branch
        githubRepo.branches.add(activeBranch);
        // reset githubRepo state
        keypather.set(githubRepo, 'state.activeBranch', activeBranch);
        keypather.set(githubRepo, 'state.selectedBranch', activeBranch);
        // reset branch state
        activeBranch.state = {};
        $rootScope.safeApply();
        return activeBranch;
      }

      // Fetch Helpers

      function fetchCommitsForBranch (appCodeVersion, activeBranch, cb) {
        cb = cb || function () {};
        activeBranch.commits.fetch(function (err) {
          $rootScope.safeApply();
          if (err) {
            return cb(err);
          }
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

      function fetchOwnerRepos(page, cb) {
        if (typeof page === 'function') {
          cb = page;
          page = 1;
          $scope.data.githubRepos = null;
        }
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
          .query({page: page, sort: 'updated'})
          .cacheFetch(function updateDom(githubRepos, cached, cb) {
            if (!$scope.data.githubRepos) {
              $scope.data.githubRepos = githubRepos;
            } else {
              var temp = $scope.data.githubRepos.models.concat(githubRepos.models);
              $scope.data.githubRepos = thisUser.newGithubRepos(temp, {
                noStore: true
              });
            }
            $rootScope.safeApply();
            if (githubRepos && githubRepos.models.length === 100) {
              fetchOwnerRepos(page + 1, cb);
            } else {
              cb();
            }
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
          data.version.appCodeVersions.forEach(function (acv) {
            setActiveBranchByName(acv, acv.attrs.branch);
          });
          callback();
        }
        function fetchCommits (callback) {
          // fetch all commits for branch and set activeCommit state
          async.each(data.version.appCodeVersions.models,
            function (acv, cb) {
              var githubRepo = acv.githubRepo;
              var activeBranch = githubRepo.state.activeBranch;
              var activeCommit = githubRepo.newCommit(acv.attrs.commit);
              async.parallel([
                fetchCommit,
                fetchCommitDiff
              ], cb);
              function fetchCommit (cb) {
                activeCommit.fetch(function (err) {
                  $rootScope.safeApply();
                  cb(err);
                });
              }
              function fetchCommitDiff (cb) {
                setActiveCommit(acv, activeBranch, activeCommit, cb);
              }
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
