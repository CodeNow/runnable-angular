require('app')
  .directive('editRepoCommit', editRepoCommit);
/**
 * @ngInject
 */
function editRepoCommit(
  async,
  QueryAssist,
  fetchUser,
  keypather,
  $rootScope,
  $state,
  $stateParams,
  user
) {
  return {
    restrict: 'A',
    templateUrl: 'viewEditRepoCommit',
    scope: {
      acv: '=appCodeVersion',
      unsavedAcv: '=unsavedAppCodeVersion'
    },
    link: function ($scope, elem, attrs) {

      // controls appearance of
      // gear-menu popover
      // to fast-forward/delete
      if ($state.$current.name === 'instance.instance') {
        $scope.showEditGearMenu = false;
        $scope.showPendingClassWhenSelectedOutdatedCommit = true;
      } else {
        $scope.showEditGearMenu = true;
      }

      // emits (broadcast up DOM tree) event to be
      // intercepted by directive-runnable-repo-list
      // when ACV selected commit changes
      function emitACVChange(opts) {
        $scope.$emit('acv-change', opts);
      }

      $scope.activeBranch = null;
      $scope.activeCommit = null;
      $scope.commitsBehind = null;

      // use watchers to share branch/commit between
      // this scope and popover + keep sync
      $scope.$watch('activeBranch', function (n) {
        if (n) { $scope.popoverRepositoryToggle.data.activeBranch = n; }
      });
      $scope.$watch('activeCommit', function (n) {
        if (n) { $scope.popoverRepositoryToggle.data.activeCommit = n; }
      });
      $scope.$watch('build', function (n) {
        if (n) { $scope.popoverRepositoryToggle.data.build = n; }
      });

      $scope.popoverRepositoryToggle = {
        data: {},
        actions: {}
      };
      $scope.popoverRepositoryToggle.data.show = false;
      $scope.popoverRepositoryToggle.data.acv = $scope.acv;
      $scope.popoverRepositoryToggle.data.unsavedAcv = $scope.unsavedAcv;
      $scope.popoverRepositoryToggle.data.toggleFilter = false;
      $scope.popoverRepositoryToggle.data.commitFilter = '';

      $scope.popoverRepositoryToggle.actions.selectBranch = function (activeBranch) {
        $scope.activeBranch = activeBranch;
        fetchBranchCommits($scope.activeBranch);
      };

      $scope.popoverRepositoryToggle.actions.selectCommit = function (commitSha) {
        $scope.popoverRepositoryToggle.data.show = false;
        $scope.unsavedAcv.attrs.branch = $scope.activeBranch.attrs.name;
        $scope.unsavedAcv.attrs.commit = commitSha;
        setActiveCommit($scope.unsavedAcv);
        fetchCommitOffset($scope.unsavedAcv, $scope.activeCommit);
        emitACVChange();
      };

      // reset filter when opening popover
      $scope.$watch('popoverRepositoryToggle.data.show', function (n) {
        if (!n) { return; }
        $scope.popoverRepositoryToggle.data.toggleFilter = false;
        $scope.popoverRepositoryToggle.data.commitFilter = '';
      });

      // reset branch if selected commit does
      // not belong to selected branch
      // on popoverRepositoryToggle close
      $scope.$watch('popoverRepositoryToggle.data.show', function (n, p) {
        if (n === false && p === true) {
          // was open, is now closed
          setActiveBranch($scope.unsavedAcv);
        }
      });

      // keep scopes in sync
      $scope.$watch('commitsBehind', function (n) {
        if (!n) { return; }
        $scope.popoverRepoActions.data.commitsBehind = n;
      });

      // FIXME: Hack around toggle-popover being on above scope
      $scope.$watch('acv.state.showModal', console.log.bind(console));
      // TODO: pass in through isolation stuffs.

      $scope.popoverRepoActions = {
        data: {},
        actions: {}
      };
      $scope.popoverRepoActions.data.acv = $scope.acv;
      $scope.popoverRepoActions.data.unsavedAcv = $scope.unsavedAcv;
      $scope.popoverRepoActions.actions.deleteRepo = function () {
        $scope.acv.destroy(function (err) {
          $rootScope.safeApply();
          if (err) { throw err; }
        });
      };

      $scope.selectLatestCommit = function () {
        var latestCommit = $scope.activeBranch.commits.models[0];
        $scope.unsavedAcv.attrs.commit = latestCommit.attrs.sha;
        $scope.unsavedAcv.attrs.branch = $scope.activeBranch.attrs.name;
        setActiveBranch($scope.unsavedAcv);
        setActiveCommit($scope.unsavedAcv);
        fetchCommitOffset($scope.unsavedAcv, $scope.activeCommit);
        emitACVChange({triggerBuild: true});
      };

      setActiveBranch($scope.acv);
      setActiveCommit($scope.acv);
      fetchCommitOffset($scope.acv, $scope.activeCommit);
      fetchBranchCommits($scope.activeBranch);

      async.series([
        function (cb) {
          fetchUser(function(err, user) {
            if (err) { return cb(err); }
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          });
        },
        fetchBuild
      ]);

      function setActiveBranch(acv) {
        // API client caches models by URL
        // $scope.activeBranch will === acv.githubRepo.branches.models[x]
        // after the fetch
        $scope.activeBranch = acv.githubRepo.newBranch(acv.attrs.branch);
        acv.githubRepo.branches.add($scope.activeBranch);
        acv.githubRepo.branches.fetch(function (err) {
          if (err) { throw err; }
          //githubRepo.branches.add(activeBranch);
          $rootScope.safeApply();
        });
      }

      function setActiveCommit(acv) {
        $scope.activeCommit = acv.githubRepo.newCommit(acv.attrs.commit);
        $scope.activeCommit.fetch(function (err) {
          if (err) { throw err; }
          $rootScope.safeApply();
        });
      }

      function fetchCommitOffset(acv, activeCommit) {
        activeCommit.commitOffset(acv.attrs.branch, function (err, diff) {
          if (err) {
            // not a throw situation
            // 404 could mean the commit doesn't exist on that branch anymore (git reset)
            // view will display 'update to latest' message if commitsBehind falsy
            $scope.commitsBehind = false;
          } else {
            $scope.commitsBehind = diff.behind_by;
          }
          $rootScope.safeApply();
        });
      }

      function fetchBranchCommits(branch) {
        branch.commits.fetch(function (err) {
          if (err) { throw err; }
          $rootScope.safeApply();
        });
      }

      function fetchBuild(cb) {
        if (!$stateParams.buildId) {
          return fetchInstance(cb);
        }
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchBuild')
          .query($stateParams.buildId)
          .cacheFetch(function (build, cached, cb) {
            $scope.build = build;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, build, cb) {
            if (err) { throw err; }
            $rootScope.safeApply();
            cb();
          })
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
            $scope.build = instance.build;
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

    }
  };
}
