require('app')
  .directive('runnableRepoActions', RunnableRepoActions);
/**
 * @ngInject
 */
function RunnableRepoActions (
  $rootScope
) {
  return {
    restrict: 'E',
    templateUrl: 'viewRepoActions',
    replace: true,
    scope: {
      acv: '=appCodeVersion',
      activeCommit: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.popoverData = {data:{}, actions:{}};
      $scope.popoverData.data.show = false;
      $scope.popoverData.data.acv = $scope.acv;

      $scope.popoverData.actions.selectLatestCommit = function () {
        var latestCommit = $scope.activeBranch.commits.models[0];
      };

      $scope.deleteRepo = function () {
      };

      $scope.$watch('commitsBehind', function (n) {
        if (!n) return;
        $scope.popoverData.data.commitsBehind = n;
      });

      setActiveBranch($scope.acv, $scope.acv.attrs.branch);
      setActiveCommit($scope.acv);
      fetchCommitOffset($scope.acv, $scope.activeCommit);
      fetchBranchCommits($scope.activeBranch);

      function setActiveBranch (acv, activeBranchName) {
        var githubRepo = acv.githubRepo;
        var activeBranch = githubRepo.newBranch(activeBranchName);
        $scope.activeBranch = activeBranch;
        githubRepo.branches.fetch(function (err) {
          if (err) throw err;
          githubRepo.branches.add(activeBranch);
          $rootScope.safeApply();
        });
        $rootScope.safeApply();
      }

      function setActiveCommit (acv) {
        var githubRepo = acv.githubRepo;
        $scope.activeCommit = githubRepo.newCommit(acv.attrs.commit);
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
