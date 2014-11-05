require('app')
  .directive('runnableRepoList', RunnableRepoList);
/**
 * @ngInject
 */
function RunnableRepoList(
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

      // add-repo-popover
      // Object to pass reference instead of value
      // into child directive
      $scope.data = {
        show: false
      };

      // display guide if no repos added
      switch ($state.$current.name) {
        case 'instance.setup':
          $scope.showAddFirstRepoMessage = true;
          break;
        case 'instance.instanceEdit':
          $scope.showAddFirstRepoMessage = false;
          break;
        case 'instance.instance':
          $scope.showAddFirstRepoMessage = false;
          break;
      }

      // track all temp acvs generated
      // for each repo/child-scope
      $scope.unsavedAcvs = [];
      $scope.newUnsavedAcv = function (acv) {
        var cv = $scope.build.contextVersions.models[0];
        var newAcv = cv.newAppCodeVersion(acv.toJSON(), {
          noStore: true
        });
        $scope.unsavedAcvs.push({
          unsavedAcv: newAcv,
          acv: acv
        });
        return newAcv;
      };

      // selected repo commit change
      $scope.$on('acv-change', function (event) {
        event.stopPropagation();
        if ($scope.unsavedAcvs.length === 1) {
          // Immediately update/rebuild if user only has 1 repo
          $scope.triggerInstanceUpdateOnRepoCommitChange();
        }
      });

      // if we find 1 repo w/ an unsaved
      // commit, show update button (if there is > 1 repos for this project)
      $scope.showUpdateButton = function () {
        // update button only present on instance.instance
        return ($state.$current.name === 'instance.instance') &&
                $scope.unsavedAcvs.length > 1 &&
                !!$scope.unsavedAcvs.find(function (obj) {
                  return obj.unsavedAcv.attrs.commit !== obj.acv.attrs.commit;
                });
      };

      $scope.triggerInstanceUpdateOnRepoCommitChange = function () {
        var context = $scope.build.contexts.models[0];
        var contextVersion = $scope.build.contextVersions.models[0];
        var infraCodeVersionId = contextVersion.attrs.infraCodeVersion;
        // fetches current state of repos listed in DOM w/ selected commits
        var appCodeVersionStates = $scope.unsavedAcvs.map(function (obj) {
          var acv = obj.unsavedAcv;
          return {
            repo: acv.attrs.repo,
            branch: acv.attrs.branch,
            commit: acv.attrs.commit
          };
        });

        async.waterfall([
          findOrCreateContextVersion,
          createBuild,
          buildBuild,
          updateInstanceWithBuild,
          reloadController
        ], function (err) {
          $rootScope.safeApply();
          if (err) throw err;
          //$rootScope.dataApp.data.loading = false;
          $state.go('instance.instance');
        });

        // if we find this contextVersion, reuse it.
        // otherwise create a new one
        function findOrCreateContextVersion(cb) {
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

        function createBuild(contextVersion, cb) {
          var build = $scope.user.createBuild({
            contextVersions: [contextVersion.id()],
            owner: $scope.instance.attrs.owner
          }, function (err) {
            cb(err, build);
          });
        }

        function buildBuild(build, cb) {
          build.build({
            message: 'Update application code version(s)' // TODO: better message
          }, function (err) {
            cb(err, build);
          });
        }

        function updateInstanceWithBuild(build, cb) {
            $scope.instance.update({
              build: build.id()
            }, function (err) {
              cb(err, build);
            });
          }
          /**
           * Trigger a forced refresh
           * Alternatives cumbersome/buggy
           * This best/easiest solution for now
           */
        function reloadController(build, cb) {
          cb();
          var current = $state.current;
          var params = angular.copy($stateParams);
          $state.transitionTo(current, params, {
            reload: true,
            inherit: true,
            notify: true
          });
        }
      };

      function fetchUser(cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {})
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
            if (err) throw err;
            $rootScope.safeApply();
            cb();
          })
          .go();
      }

      async.series([
        fetchUser,
        fetchBuild
      ]);

    }
  };
}
