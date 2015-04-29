'use strict';

require('app')
  .directive('repoList', repoList);
/**
 * @ngInject
 *
 * Attributes:
 *  showAutoDeploy: true if the 'Disable AutoDeploy' cb should be present
 *  showAddFirstRepoMessage: true if the helper message should be present (setup)
 *  autoBuildOnAcvChange: true if the build should rebuild after making an ACV change
 */
function repoList(
  $rootScope,
  createNewBuild,
  debounce,
  errs,
  eventTracking,
  keypather,
  pFetchUser,
  promisify,
  $localStorage
) {
  return {
    restrict: 'A',
    templateUrl: 'viewRepoList',
    scope: {
      loading: '=',
      instance: '=',
      build: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.$storage = $localStorage.$default({
        repoListIsClosed: false
      });

      if (attrs.showAutoDeploy) {
        $scope.showAutoDeploy = true;
      }
      // add-repo-popover
      // Object to pass reference instead of value
      // into child directive
      $scope.data = {
        show: false
      };
      $scope.unsavedAcvs = [];
      $scope.showAddFirstRepoMessage = attrs.showAddFirstRepoMessage;

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
        // mixpanel tracking, did this acv change trigger a build
        var triggeredBuild = false;
        if (attrs.autoBuildOnAcvChange) {
          if ($scope.unsavedAcvs.length === 1) {
            // Immediately update/rebuild if user only has 1 repo
            triggeredBuild = true;
            $scope.triggerInstanceUpdateOnRepoCommitChange();
          }
          else if (opts && opts.triggerBuild) {
            triggeredBuild = true;
            $scope.triggerInstanceUpdateOnRepoCommitChange();
          }
        }
        else if (opts) {
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
        // track event w/ mixpanel
        eventTracking.toggledCommit({
          acv: keypather.get(opts, 'acv.toJSON()'),
          triggeredBuild: triggeredBuild
        });
      });

      // if we find 1 repo w/ an unsaved
      // commit, show update button (if there is > 1 repos for this project)
      $scope.showUpdateButton = function () {
        // update button only present on instance.instance
        if (!attrs.autoBuildOnAcvChange ||
            $scope.unsavedAcvs.length < 2) {
          return false;
        }
        return !!$scope.unsavedAcvs.find(function (obj) {
          return obj.unsavedAcv.commit !== obj.acv.attrs.commit;
        });
      };

      $scope.triggerInstanceUpdateOnRepoCommitChange = function () {
        eventTracking.triggeredBuild(false);
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

      if (attrs.showAutoDeploy) {
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
      }

      pFetchUser(
      ).then(function (user) {
        $scope.user = user;
      }).catch(errs.handler);

    }
  };
}
