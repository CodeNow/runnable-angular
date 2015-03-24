'use strict';

require('app')
  .directive('editRepoCommit', editRepoCommit);
/**
 * @ngInject
 */
function editRepoCommit(
  fetchCommitData,
  errs
) {
  return {
    restrict: 'A',
    templateUrl: 'viewEditRepoCommit',
    scope: {
      model: '=',
      showRemoveRepo: '='
    },
    link: function ($scope, elem, attrs) {
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
        $scope.model.unsavedAcv.branch = $scope.activeBranch.attrs.name;
        $scope.model.unsavedAcv.commit = commitSha;
        $scope.activeCommit = fetchCommitData.activeCommit($scope.model.acv, commitSha);
        emitACVChange(
          {
            acv: $scope.model.acv,
            updateOpts: $scope.model.unsavedAcv
          }
        );
      };
      // controls appearance of
      // gear-menu popover
      // to fast-forward/delete
      if ($scope.showRemoveRepo) {
        $scope.popoverRepositoryToggle.data.showDeleteButton = true;
      } else {
        $scope.popoverRepositoryToggle.data.showDeleteButton = false;
        $scope.showPendingClassWhenSelectedOutdatedCommit = true;
      }

      // reset filter when opening popover
      $scope.$watch('popoverRepositoryToggle.data.show', function (n, p) {
        // reset branch if selected commit does
        // not belong to selected branch
        // on popoverRepositoryToggle close
        if (n === false && p === true) {
          // was open, is now closed
          $scope.activeBranch = fetchCommitData.activeBranch($scope.model.acv, $scope.model.unsavedAcv.branch);
        } else if (!n) { return; }
        $scope.popoverRepositoryToggle.data.toggleFilter = false;
        $scope.popoverRepositoryToggle.data.commitFilter = '';
      });

      $scope.popoverRepoActions = {
        data: {},
        actions: {}
      };
      $scope.popoverRepositoryToggle.actions.deleteRepo = function () {
        $scope.model.acv.destroy(errs.handler);
      };

      $scope.$watch('model', function(n) {
        if (!n) { return; }
        $scope.activeBranch = fetchCommitData.activeBranch($scope.model.acv);
        $scope.activeCommit = fetchCommitData.activeCommit($scope.model.acv);

        $scope.popoverRepoActions.data.acv = $scope.model.acv;
        $scope.popoverRepoActions.data.unsavedAcv = $scope.model.unsavedAcv;
        $scope.popoverRepositoryToggle.data.acv = $scope.model.acv;
        $scope.popoverRepositoryToggle.data.unsavedAcv = $scope.model.unsavedAcv;
        // Silence errors on bad branch fetch
        // We don't want a 404 modal when we can't find the branch
        fetchCommitData.branchCommits($scope.activeBranch);
      });
    }
  };
}
