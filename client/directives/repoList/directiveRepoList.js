'use strict';

require('app')
  .directive('repoList', repoList);
/**
 * @ngInject
 */
function repoList(
  async,
  debounce,
  errs,
  keypather,
  QueryAssist,
  pFetchUser,
  fetchBuild,
  $rootScope,
  $state,
  $stateParams,
  $q,
  fetchInstances
) {
  return {
    restrict: 'A',
    templateUrl: 'viewRepoList',
    scope: {
      loading: '=',
      unsavedAcvs: '='
    },
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
        case 'demo.instanceEdit':
          $scope.data.show = true;
          break;
      }

      // track all temp acvs generated
      // for each repo/child-scope
      $scope.newUnsavedAcv = function (acv) {
        var cv = $scope.build.contextVersions.models[0];
        var acvJson = acv.toJSON();
        delete acvJson._id;
        delete acvJson.id;
        var newAcv = cv.newAppCodeVersion(acvJson, {
          warn: false
        });
        $scope.unsavedAcvs.push({
          unsavedAcv: newAcv,
          acv: acv
        });
        return newAcv;
      };

      // selected repo commit change
      $scope.$on('acv-change', function (event, opts) {
        event.stopPropagation();
        if ($scope.unsavedAcvs.length === 1) {
          // Immediately update/rebuild if user only has 1 repo
          $scope.triggerInstanceUpdateOnRepoCommitChange();
        } else if (opts && opts.triggerBuild) {
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
        // display loading spinner
        $scope.loading = true;
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
          if (err) { throw err; }
          //$rootScope.dataApp.data.loading = false;
          $state.go('instance.instance');
        });

        // if we find this contextVersion, reuse it.
        // otherwise create a new one
        function findOrCreateContextVersion(cb) {
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
            notify: true,
            location: 'replace'
          });
        }
      };

      var debounceUpdate = debounce(function(n) {
        if (n !== undefined && n !== $scope.instance.attrs.locked) {
          $scope.instance.update({
            locked: n
          }, angular.noop);
        }
      });

      $scope.$watch('data.autoDeploy', debounceUpdate);

      function fetchInstance() {
        return fetchInstances({
          name: $stateParams.instanceName
        })
        .then(function(instance) {
          $scope.instance = instance;
          if (!$stateParams.buildId) {
            $scope.build = instance.build;
            // HACK: allows us to use both an independent build (setup/edit)
            //    and the build of an instance (instance)
            // This will be triggered when a new build is passed to us by API
            $scope.$watch('instance.build',   function(n) {
              if (n) { $scope.build = $scope.instance.build; }
            });
          }
          $scope.data.autoDeploy = instance.attrs.locked;
        });
      }

      pFetchUser.then(function(user) {
        $scope.user = user;
        if ($state.$current.name === 'instance.setup') {
          return fetchBuild($stateParams.buildId);
        }
        if ($state.$current.name === 'instance.instance') {
          return fetchInstance();
        }
        // Instance Edit
        return $q.all([
          fetchBuild($stateParams.buildId),
          fetchInstance()
        ]);
      }).catch(errs.handler);

    }
  };
}
