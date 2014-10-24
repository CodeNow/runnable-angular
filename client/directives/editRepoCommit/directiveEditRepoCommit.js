require('app')
  .directive('runnableEditRepoCommit', RunnableEditRepoCommit);
/**
 * @ngInject
 */
function RunnableEditRepoCommit (
  $rootScope
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

      $scope.popoverCommitSelect = {
        data: {},
        actions: {}
      };
      // share appCodeVersion with popover to display branches/commits in popover
      $scope.popoverCommitSelect.data.acv = $scope.acv;

      setActiveBranch($scope.acv, $scope.acv.attrs.branch);
      setActiveCommit($scope.acv);
      fetchCommitOffset($scope.acv, $scope.activeCommit);

      function setActiveBranch (acv, activeBranchName) {
        var githubRepo = acv.githubRepo;
        var activeBranch = githubRepo.newBranch(activeBranchName);
        // why client-side populate collection?
        githubRepo.branches.add(activeBranch);
        activeBranch.state = {};
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

    }
  };
}
