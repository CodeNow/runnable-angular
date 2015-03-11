'use strict';

require('app')
  .directive('repoList', repoList);
/**
 * @ngInject
 */
function repoList(
  debounce,
  errs,
  keypather,
  pFetchUser,
  $state,
  $rootScope,
  createNewBuild,
  promisify
) {
  return {
    restrict: 'A',
    templateUrl: 'viewRepoList',
    scope: {
      loading: '=',
      instance: '=',
      build: '='
    },
    link: function ($scope, elem) {

      // add-repo-popover
      // Object to pass reference instead of value
      // into child directive
      $scope.data = {
        show: false
      };
      $scope.unsavedAcvs = [];

      $scope.showAddFirstRepoMessage = ($state.$current.name === 'instance.setup');
      $scope.showAddRepo = ($state.$current.name !== 'instance.instance');

      // track all temp acvs generated
      // for each repo/child-scope
      $scope.newUnsavedAcv = function (acv) {
        var unsaved = angular.copy(acv.attrs);
        delete unsaved.id;
        delete unsaved._id;
        var model = {
          unsavedAcv: unsaved,
          acv: acv
        };
        $scope.unsavedAcvs.push(model);
        return model;
      };

      $scope.$watchCollection('build.contextVersions.models[0].appCodeVersions.models', function (n) {
        if (n !== undefined) {
          while ($scope.unsavedAcvs.length) {
            $scope.unsavedAcvs.pop();
          }
          n.forEach(function (acv) {
            $scope.newUnsavedAcv(acv);
          });
        }
      });

      // selected repo commit change
      $scope.$on('acv-change', function (event, opts) {
        if ($state.$current.name === 'instance.instance') {
          if ($scope.unsavedAcvs.length === 1) {
            // Immediately update/rebuild if user only has 1 repo
            $scope.triggerInstanceUpdateOnRepoCommitChange();
          } else if (opts && opts.triggerBuild) {
            $scope.triggerInstanceUpdateOnRepoCommitChange();
          }
        } else if (opts) {
          var dirtyValue = keypather.get($scope.build, 'state.dirty') || 0;
          keypather.set($scope.build, 'state.dirty', ++dirtyValue);
          promisify(opts.acv, 'update')(
            opts.updateOpts
          ).catch(
            errs.handler
          ).finally(function () {
            var dirtyValue = keypather.get($scope.build, 'state.dirty');
            keypather.set($scope.build, 'state.dirty', --dirtyValue);
          });
        }
      });

      // if we find 1 repo w/ an unsaved
      // commit, show update button (if there is > 1 repos for this project)
      $scope.showUpdateButton = function () {
        // update button only present on instance.instance
        if ($state.$current.name !== 'instance.instance' ||
            $scope.unsavedAcvs.length < 2) {
          return false;
        }
        return !!$scope.unsavedAcvs.find(function (obj) {
          return obj.unsavedAcv.commit !== obj.acv.attrs.commit;
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
          return obj.unsavedAcv;
        });

        createNewBuild(
          $rootScope.dataApp.data.activeAccount,
          context,
          infraCodeVersionId,
          appCodeVersionStates
        ).then(
          buildBuild
        ).then(
          updateInstanceWithBuild
        ).catch(
          errs.handler
        ).finally(function () {
          $scope.loading = false;
        });

        function buildBuild(build) {
          return promisify(build, 'build')({
            message: 'Update application code version(s)' // TODO: better message
          });
        }

        function updateInstanceWithBuild(build) {
          return promisify($scope.instance, 'update')({
            build: build.id()
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

      $scope.$watch('instance.attrs.locked', function (n) {
        if (n !== undefined) {
          $scope.data.autoDeploy = n;
        }
      });

      pFetchUser(
      ).then(function (user) {
        $scope.user = user;
      }).catch(errs.handler);

    }
  };
}
