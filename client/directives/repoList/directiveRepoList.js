require('app')
  .directive('runnableRepoList', RunnableRepoList);
/**
 * @ngInject
 */
function RunnableRepoList (
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
    templateUrl: 'viewRepoList',
    replace: true,
    scope: {},
    link: function ($scope, elem) {

      // display guide if no repos added
      $scope.showGuide = true;

      $scope.unsavedAcvs = [];
      $scope.newUnsavedAcv = function (acv) {
        var cv = $scope.build.contextVersions.models[0];
        var newAcv = cv.newAppCodeVersion(acv.toJSON(), {
          noStore: true
        });
        $scope.unsavedAcvs.push(newAcv);
        return newAcv;
      };
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
            $scope.build    = instance.build;
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

      function fetchBuild (cb) {
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
            if (err) throw err;
            $rootScope.safeApply();
            cb();
          })
          .go();
      }

      /**
       * Models in build.contextVersions collection will
       * have empty appCodeVersion collections by default.
       * Perform fetch on each contextVersion to populate
       * appCodeVersions collection
       */
      function fetchBuildContextVersions (cb) {
        if (!$scope.build.contextVersions.models[0]) {
          // TODO finish
          return;
        }
        $scope.build.contextVersions.models[0].fetch(function (err) {
          if (err) throw err;
          cb();
        });
      }

      async.series([
        fetchUser,
        fetchBuild
      ]);

      /*
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
*/
    }
  };
}
