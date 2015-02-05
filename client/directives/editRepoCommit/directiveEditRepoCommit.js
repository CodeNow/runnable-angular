'use strict';

require('app')
  .directive('editRepoCommit', editRepoCommit);
/**
 * @ngInject
 */
function editRepoCommit(
  fetchCommitData,
  errs,
  $state
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
        // Silence errors on bad branch fetch
        // We don't want a 404 modal when we can't find the branch
        fetchCommitData.branchCommits(activeBranch);
      };

      $scope.popoverRepositoryToggle.actions.selectCommit = function (commitSha) {
        $scope.popoverRepositoryToggle.data.show = false;
        $scope.unsavedAcv.attrs.branch = $scope.activeBranch.attrs.name;
        $scope.unsavedAcv.attrs.commit = commitSha;
        $scope.activeCommit = fetchCommitData.activeCommit($scope.unsavedAcv);
        emitACVChange();
      };

      // reset filter when opening popover
      $scope.$watch('popoverRepositoryToggle.data.show', function (n, p) {
        // reset branch if selected commit does
        // not belong to selected branch
        // on popoverRepositoryToggle close
        if (n === false && p === true) {
          // was open, is now closed
          $scope.activeBranch = fetchCommitData.activeBranch($scope.unsavedAcv);
        } else if (!n) { return; }
        $scope.popoverRepositoryToggle.data.toggleFilter = false;
        $scope.popoverRepositoryToggle.data.commitFilter = '';
      });

      $scope.popoverRepoActions = {
        data: {},
        actions: {}
      };
      $scope.popoverRepoActions.data.acv = $scope.acv;
      $scope.popoverRepoActions.data.unsavedAcv = $scope.unsavedAcv;
      $scope.popoverRepoActions.actions.deleteRepo = function () {
        $scope.acv.destroy(errs.handler);
      };

      $scope.$watch('acv', function(n) {
        if (!n) { return; }
        $scope.activeBranch = fetchCommitData.activeBranch($scope.acv);
        $scope.activeCommit = fetchCommitData.activeCommit($scope.acv);
        // Silence errors on bad branch fetch
        // We don't want a 404 modal when we can't find the branch
        fetchCommitData.branchCommits($scope.activeBranch);
      });
    }
  };
}
