 'use strict';

require('app')
  .directive('demoAddBranch', demoAddBranch);
/**
 * @ngInject
 */
function demoAddBranch(
  $q,
  $state,
  $timeout,
  currentOrg,
  demoFlowService,
  errs,
  fetchInstancesByPod,
  fetchRepoBranches,
  featureFlags,
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

  function getBranchForPR () {
    return promisify(currentOrg.github, 'fetchRepo')($scope.instance.getRepoName())
      .then(function (repo) {
        return fetchRepoBranches(repo);
      })
      .then(function (branches) {
        var darkTheme = branches.models.find(function(branch) {
          return keypather.get(branch, 'attrs.name') === 'dark-theme';
        });
        var sha = darkTheme.attrs.commit.sha;
        var branchName = darkTheme.attrs.name;
        return promisify($scope.instance, 'fork')(branchName, sha)
      })
  }

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
          if (demoFlowService.isAddingPR()) {
            return demoFlowService.submitDemoPR(branchInstance)
              .then(function () {
                return branchInstance;
              })
          }
          return $q.when(branchInstance);
        })
        .then(function (branchInstance) {
          return $state.go('base.instances.instance', {
            instanceName: branchInstance.getName()
          }, {location: 'replace'});
        })
        .then(function () {
          demoFlowService.hasAddedBranch(true);
          return demoFlowService.endDemoFlow();
        })
        .finally(function () {
          loading('creatingNewBranchFromDemo', false);
        });

      $scope.shouldUseBranchForPR = function () {
        return demoFlowService.isAddingPR() &&
          featureFlags.flags.demoMultiTierPRLink;
      };

      $scope.getBranchName = function () {
        if ($scope.shouldUseBranchForPR()) {
          return 'dark-theme';
        }
        return 'my-branch';
      };

      $scope.getNewBranchString = function () {
        if (!$scope.shouldUseBranchForPR()) {
          return '-b ';
        }
        return '';
      };

      $scope.getBranchCloneCopyText = function () {
        var lb = '\r\n';
        var string = 'git clone https://github.com/' +
          $scope.userName + '/' + $scope.instance.getRepoName() + '.git' + lb +
          'cd ' + $scope.instance.getRepoName() + lb +
          'git checkout ' + $scope.getNewBranchString() + $scope.getBranchName() + lb;
        if ($scope.shouldUseBranchForPR()) {
          string += 'echo \':)\' >> README.md' + lb +
            'git add -u' + lb +
            'git commit -m \'a friendlier README\'' + lb;
        }
        string += 'git push origin ' + $scope.getBranchName() + ';';
        return string;
      };

      $scope.createNewBranch = function (count) {
        loading('creatingNewBranchFromDemo', true);
        count = count || 0;
        var acv = $scope.instance.contextVersion.getMainAppCodeVersion();
        var completeRepoName = acv.attrs.repo.split('/');
        var repoOwner = completeRepoName[0];
        var repoName = completeRepoName[1];
        var branchName = $scope.getBranchName();
        if (count) {
          branchName += '-' + count;
        }
        if (demoFlowService.isAddingPR()) {
          return getBranchForPR($scope.instance);
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
