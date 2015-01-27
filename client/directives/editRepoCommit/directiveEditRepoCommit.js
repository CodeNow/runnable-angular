'use strict';

require('app')
  .directive('editRepoCommit', editRepoCommit);
/**
 * @ngInject
 */
function editRepoCommit(
  async,
  errs,
  fetchCommitData,
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
        $scope.activeBranch.commits.fetch(errs.handler);
      };

      $scope.popoverRepositoryToggle.actions.selectCommit = function (commitSha) {
        $scope.popoverRepositoryToggle.data.show = false;
        $scope.unsavedAcv.attrs.branch = $scope.activeBranch.attrs.name;
        $scope.unsavedAcv.attrs.commit = commitSha;
        $scope.activeCommit = fetchCommitData.activeCommit($scope.unsavedAcv);
        fetchCommitData.offset($scope.unsavedAcv, $scope.activeCommit, function (err, behind) {
          // err will always be null
          $scope.commitsBehind = behind;
        });
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
          $scope.activeBranch = fetchCommitData.activeBranch($scope.unsavedAcv);
        }
      });

      // keep scopes in sync
      $scope.$watch('commitsBehind', function (n) {
        if (!n) { return; }
        $scope.popoverRepoActions.data.commitsBehind = n;
      });

      $scope.popoverRepoActions = {
        data: {},
        actions: {}
      };
      $scope.popoverRepoActions.data.acv = $scope.acv;
      $scope.popoverRepoActions.data.unsavedAcv = $scope.unsavedAcv;
      $scope.popoverRepoActions.actions.deleteRepo = function () {
        $scope.acv.destroy(function (err) {
          if (err) { throw err; }
        });
      };

      $scope.selectLatestCommit = function () {
        var latestCommit = $scope.activeBranch.commits.models[0];
        $scope.unsavedAcv.attrs.commit = latestCommit.attrs.sha;
        $scope.unsavedAcv.attrs.branch = $scope.activeBranch.attrs.name;
        $scope.activeBranch = fetchCommitData.activeBranch($scope.unsavedAcv);
        $scope.activeCommit = fetchCommitData.activeCommit($scope.unsavedAcv);
        fetchCommitData.offset($scope.unsavedAcv, $scope.activeCommit, function (err, behind) {
          // err will always be null
          $scope.commitsBehind = behind;
        });
        emitACVChange({triggerBuild: true});
      };

      $scope.$watch('acv', function(n) {
        if (!n) { return; }
        $scope.activeBranch = fetchCommitData.activeBranch($scope.acv);
        $scope.activeCommit = fetchCommitData.activeCommit($scope.acv);
        fetchCommitData.offset($scope.acv, $scope.activeCommit, function (err, behind) {
          // err will always be null
          $scope.commitsBehind = behind;
        });
        $scope.activeBranch.commits.fetch(errs.handler);
      });
    }
  };
}
