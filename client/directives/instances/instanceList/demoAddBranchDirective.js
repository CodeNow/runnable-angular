 'use strict';

require('app')
  .directive('demoAddBranch', demoAddBranch);
/**
 * @ngInject
 */
function demoAddBranch(
  $state,
  $timeout,
  demoFlowService,
  errs,
  fetchInstancesByPod,
  github,
  keypather,
  loading,
  promisify,
  watchOncePromise
) {
  return {
    restrict: 'A',
    templateUrl: 'demoAddBranchView',
    scope: {
      userName: '=',
      instance: '='
    },
    link: function ($scope, element, attrs) {
      fetchInstancesByPod()
        .then(function (instances) {
          return watchOncePromise($scope, function () {
            return instances.models.find(function (instance) {
              return keypather.get(instance, 'children.models[0]');
            });
          }, true);
        })
        .then(function (instance) {
          var branchInstance = instance.children.models[0];
          if (!instance.attrs.dependencies.length) {
            // If the master instance depends on anything, then we need to wait for the isolation
            return branchInstance;
          }
          return watchOncePromise($scope, function () {
            // Wait for the isolation model to populate
            return keypather.get(branchInstance, 'isolation.instances.fetch');
          }, true)
            .then(function () {
              // Now fetch the isolation
              return promisify(branchInstance.isolation.instances, 'fetch')();
            })
            .then(function () {
              return branchInstance;
            });
        })
        .then(function (branchInstance) {
          return $state.go('base.instances.instance', {
            instanceName: branchInstance.getName()
          });
        })
        .then(function () {
          demoFlowService.hasAddedBranch(true);
          return $timeout(function () {
            demoFlowService.endDemoFlow();
          });
        })
        .finally(function () {
          loading('creatingNewBranchFromDemo', false);
        });

      $scope.getBranchCloneCopyText = function () {
        return 'git clone https://github.com/' +
          $scope.userName + '/' + $scope.instance.getRepoName() +
          '.git; cd ' + $scope.instance.getRepoName() +
          '; git checkout -b my-branch; git push origin my-branch;';
      };

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
