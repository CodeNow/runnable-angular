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
  loading,
  promisify
) {
  return {
    restrict: 'A',
    templateUrl: 'addBranchView',
    scope: {
      userName: '=',
      instance: '='
    },
    link: function ($scope, element, attrs) {
      $scope.getBranchCloneCopyText = function () {
        return 'git clone https://github.com/' + $scope.userName + '/' + $scope.instance.attrs.name + '.git; cd ' + $scope.instance.attrs.name + '; git checkout -b my-branch; git push origin my-branch;';
      };

      $scope.createNewBranch = function () {
        loading('creatingNewBranchFromDemo', true);
        var acv = $scope.instance.contextVersion.getMainAppCodeVersion();
        var completeRepoName = acv.attrs.repo.split('/');
        var repoOwner = completeRepoName[0];
        var repoName = completeRepoName[1];
        return github.createNewBranch(repoOwner, repoName, acv.attrs.commit, 'my-branch')
          .catch(errs.handler);
      };

      $scope.onClipboardEvent = function (err) {
        if (err) {
          $scope.clipboardText = 'Could not copy text';
        } else {
          $scope.clipboardText = 'Copied!';
        }
      };
    }
  };
}
