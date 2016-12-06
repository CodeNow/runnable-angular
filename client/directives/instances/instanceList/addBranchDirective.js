'use strict';

require('app')
  .directive('addBranch', addBranch);
/**
 * @ngInject
 */
function addBranch(
  $state,
  demoFlowService,
  errs,
  fetchInstancesByPod,
  github,
  keypather,
  loading,
  watchOncePromise
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
      fetchInstancesByPod()
        .then(function (instances) {
          return watchOncePromise($scope, function () {
            var instance = instances.models.find(function (instance) {
              return keypather.get(instance, 'children.models[0]');
            });
            return keypather.get(instance, 'children.models[0]');
          }, true);
        })
        .then(function (branchInstance) {
          demoFlowService.endDemoFlow();
          loading('creatingNewBranchFromDemo', false);
          return $state.go('base.instances.instance', {
            instanceName: branchInstance.getName()
          }, {location: 'replace'});
        });

      $scope.createNewBranch = function (count) {
        loading('creatingNewBranchFromDemo', true);
        count = count || 0;
        var acv = $scope.instance.contextVersion.getMainAppCodeVersion();
        var completeRepoName = acv.attrs.repo.split('/');
        var repoOwner = completeRepoName[0];
        var repoName = completeRepoName[1];
        var branchName = 'my-branch';
        if (count) {
          branchName += '-' + count;
        }
        return github.createNewBranch(repoOwner, repoName, acv.attrs.commit, branchName)
          .catch(function (err) {
            if (err.message.match(/reference already exists/gi)) {
              return $scope.createNewBranch(++count);
            }
            errs.handler(err);
          });
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
