require('app')
  .directive('runnableEditRepoCommit', RunnableEditRepoCommit);
/**
 * @ngInject
 */
function RunnableEditRepoCommit (
  $rootScope,
  $state,
  $stateParams
) {
  return {
    restrict: 'E',
    templateUrl: 'viewEditRepoCommit',
    replace: true,
    scope: {
      acv: '=appCodeVersion',
      unsavedAcv: '=unsavedAppCodeVersion'
    },
    link: function ($scope, elem, attrs) {

      // controlls appearance of
      // gear-menu popover
      // to fast-forward/delete
      switch($state.$current.name) {
        case 'instance.setup':
          $scope.showEditGearMenu = true;
          break;
        case 'instance.instance':
          $scope.showEditGearMenu = false;
          break;
        case 'instance.instanceEdit':
          $scope.showEditGearMenu = true;
          break;
      }

      $scope.activeBranch = null;
      $scope.activeCommit = null;
      $scope.commitsBehind = null;

      // use watchers to share branch/commit between
      // this scope and popover + keep sync
      $scope.$watch('activeBranch', function (n) {
        if (n) $scope.popoverCommitSelect.data.activeBranch = n;
      });
      $scope.$watch('activeCommit', function (n) {
        if (n) $scope.popoverCommitSelect.data.activeCommit = n;
      });
      $scope.$watch('build', function (n) {
        if (n) $scope.popoverCommitSelect.data.build = n;
      });

      $scope.popoverCommitSelect = {data:{}, actions:{}};
      $scope.popoverCommitSelect.data.show = false;
      $scope.popoverCommitSelect.data.acv = $scope.acv;
      $scope.popoverCommitSelect.data.unsavedAcv = $scope.unsavedAcv;
      $scope.popoverCommitSelect.data.toggleFilter = false;
      $scope.popoverCommitSelect.data.commitFilter = '';

      $scope.popoverCommitSelect.actions.selectBranch = function (activeBranch) {
        $scope.activeBranch = activeBranch;
        fetchBranchCommits($scope.activeBranch);
      };
      $scope.popoverCommitSelect.actions.selectCommit = function (commitSha) {
        $scope.popoverCommitSelect.data.show = false;
        $scope.unsavedAcv.attrs.branch = $scope.activeBranch.attrs.name;
        $scope.unsavedAcv.attrs.commit = commitSha;
        setActiveCommit($scope.unsavedAcv);
        fetchCommitOffset($scope.unsavedAcv, $scope.activeCommit);
      };

      // reset filter when opening popover
      $scope.$watch('popoverCommitSelect.data.show', function (n) {
        if (!n) return;
        $scope.popoverCommitSelect.data.toggleFilter = false;
        $scope.popoverCommitSelect.data.commitFilter = '';
      });

      // reset branch if selected commit does
      // not belong to selected branch
      // on popoverCommitSelect close
      $scope.$watch('popoverCommitSelect.data.show', function (n, p) {
        if (n === false && p === true) {
          // was open, is now closed
          setActiveBranch($scope.unsavedAcv);
        }
      });

      // keep scopes in sync
      $scope.$watch('commitsBehind', function (n) {
        if (!n) return;
        $scope.popoverRepoActions.data.commitsBehind = n;
      });

      $scope.popoverRepoActions = {data:{}, actions:{}};
      $scope.popoverRepoActions.data.acv = $scope.acv;
      $scope.popoverRepoActions.data.unsavedAcv = $scope.unsavedAcv;
      $scope.popoverRepoActions.actions.deleteRepo = function () {
        $scope.acv.destroy(function (err) {
          $rootScope.safeApply();
          if (err) throw err;
        });
      };

      $scope.selectLatestCommit = function () {
        var latestCommit = $scope.activeBranch.commits.models[0];
        $scope.unsavedAcv.attrs.commit = latestCommit.attrs.sha;
        $scope.unsavedAcv.attrs.branch = $scope.activeBranch.attrs.name;
        setActiveBranch($scope.unsavedAcv);
        setActiveCommit($scope.unsavedAcv);
        fetchCommitOffset($scope.unsavedAcv, $scope.activeCommit);
      };

      setActiveBranch($scope.acv);
      setActiveCommit($scope.acv);
      fetchCommitOffset($scope.acv, $scope.activeCommit);
      fetchBranchCommits($scope.activeBranch);

      function setActiveBranch (acv) {
        $scope.activeBranch = acv.githubRepo.newBranch(acv.attrs.branch);
        acv.githubRepo.branches.fetch(function (err) {
          if (err) throw err;
          // githubRepo.branches.add(activeBranch);
          $rootScope.safeApply();
        });
        $rootScope.safeApply();
      }

      function setActiveCommit (acv) {
        $scope.activeCommit = acv.githubRepo.newCommit(acv.attrs.commit);
        $scope.activeCommit.fetch(function (err) {
          if (err) throw err;
          $rootScope.safeApply();
        });
        $rootScope.safeApply();
      }

      function fetchCommitOffset (acv, activeCommit) {
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

      function fetchBranchCommits (branch) {
        branch.commits.fetch(function (err) {
          if (err) throw err;
          $rootScope.safeApply();
        });
      }

    }
  };
}
