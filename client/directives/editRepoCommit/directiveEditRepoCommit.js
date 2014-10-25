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
      acv: '=appCodeVersion'
    },
    link: function ($scope, elem, attrs) {

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

      $scope.popoverCommitSelect = {
        data: {},
        actions: {}
      };
      // share appCodeVersion with popover to display branches/commits in popover
      $scope.popoverCommitSelect.data.acv = $scope.acv;
      $scope.popoverCommitSelect.data.toggleFilter = false;
      $scope.popoverCommitSelect.data.commitFilter = '';
      // $scope.popoverCommitSelect.actions. = function () {};

      setActiveBranch($scope.acv, $scope.acv.attrs.branch);
      setActiveCommit($scope.acv);
      fetchCommitOffset($scope.acv, $scope.activeCommit);
      fetchBranchCommits($scope.activeBranch);

      function setActiveBranch (acv, activeBranchName) {
        var githubRepo = acv.githubRepo;
        var activeBranch = githubRepo.newBranch(activeBranchName);
        // why client-side populate collection?
        githubRepo.branches.add(activeBranch);
        $scope.activeBranch = activeBranch;
        $rootScope.safeApply();
      }

      function setActiveCommit (acv) {
        var githubRepo = acv.githubRepo;
        $scope.activeCommit = githubRepo.newCommit(acv.attrs.commit);
        $rootScope.safeApply();
      }

      function fetchCommitOffset (acv, activeCommit) {
        activeCommit.fetch(function (err) {
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
