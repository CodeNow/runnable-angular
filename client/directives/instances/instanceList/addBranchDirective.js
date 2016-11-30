'use strict';

require('app')
  .directive('addBranch', addBranch);
/**
 * @ngInject
 */
function addBranch(
  errs,
  github,
  fetchRepoBranches,
  promisify
) {
  return {
    restrict: 'A',
    templateUrl: 'addBranchView',
    scope: {
      userName: '=',
      instance: '=',
      isDemoRepo: '='
    },
    link: function ($scope, element, attrs) {
      $scope.getBranchCloneCopyText = function () {
        return 'git clone https://github.com/' + $scope.userName + '/' + $scope.instance.attrs.name + '.git; cd node-starter; git checkout -b my-branch; git push origin my-branch;';
      };

      $scope.createNewBranch = function () {
        var acv = $scope.instance.contextVersion.getMainAppCodeVersion();
        var completeRepoName = acv.attrs.repo.split('/');
        var repoOwner = completeRepoName[0];
        var repoName = completeRepoName[1];
        return github.createNewBranch(repoOwner, repoName, acv.attrs.commit, 'my-branch')
          .catch(errs.handler);
      };

      $scope.forkFirstBranch = function () {
        var acv = $scope.instance.contextVersion.getMainAppCodeVersion();
        return fetchRepoBranches(acv.githubRepo)
          .then(function (branches) {
            // Gets first brnach alphabetically
            var firstBranch = branches.models[0];
            var branchName = firstBranch.attrs.name;
            var sha = firstBranch.attrs.commit.sha;
            return promisify($scope.instance, 'fork')(branchName, sha);
          })
          .catch(errs.handler);
      };
    }
  };
}
