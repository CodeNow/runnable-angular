'use strict';

require('app')
  .controller('DemoAddBranchController', DemoAddBranchController);

function DemoAddBranchController(
  $q,
  $scope,
  $state,
  $timeout,
  currentOrg,
  demoFlowService,
  errs,
  fetchInstancesByPod,
  featureFlags,
  github,
  keypather,
  loading,
  promisify,
  watchOncePromise
) {
  var DBC = this;

  function getBranchForPR (instance) {
    function getShaForBranch() {
      var fetchError = new Error('Sorry, we were unable to automatically add the branch. Please click the add branch button.');
      var repo = keypather.get(instance, 'contextVersion.getMainAppCodeVersion().repo');
      if (!repo) {
        return $q.reject(fetchError);
      }
      return promisify(repo, 'fetchBranch')('dark-theme')
        .then(function (branch) {
          var sha = branch.attrs.commit.sha;
          if (!sha) {
            return $q.reject(fetchError);
          }
          return sha;
        });
    }

    return getShaForBranch()
      .catch($timeout(getShaForBranch, 250))
      .catch($timeout(getShaForBranch, 250))
      .catch($timeout(getShaForBranch, 250))
      .catch($timeout(getShaForBranch, 250))
      .catch($timeout(getShaForBranch, 250))
      .then(function (sha) {
        return promisify(instance, 'fork')('dark-theme', sha);
      })
      .catch(function (err) {
        var fetchError = new Error('Sorry, we were unable to automatically add the branch. Please click the add branch button.');
        errs.reportError(err, 'DemoAddBranchController');
        errs.handler(fetchError);
      });
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
      demoFlowService.hasAddedBranch(true);
      if (demoFlowService.shouldAddPR() && !currentOrg.isPersonalAccount()) {
        return demoFlowService.submitDemoPR(branchInstance)
          .then(function () {
            return branchInstance;
          })
          .catch(function (err) {
            if (keypather.get(err, 'errors[0].message').match(/(pull request.*exists)/)) {
              return branchInstance;
            }
            errs.handler(err);
          });
      }
      return branchInstance;
    })
    .then(function (branchInstance) {
      return $state.go('base.instances.instance', {
        instanceName: branchInstance.getName()
      });
    })
    .finally(function () {
      loading('creatingNewBranchFromDemo', false);
    });

  DBC.shouldUseBranchForPR = function () {
    return demoFlowService.shouldAddPR();
  };

  DBC.getBranchName = function () {
    if (DBC.shouldUseBranchForPR()) {
      return 'dark-theme';
    }
    return 'my-branch';
  };

  DBC.getNewBranchString = function () {
    if (!DBC.shouldUseBranchForPR()) {
      return '-b ';
    }
    return '';
  };

  DBC.getBranchCloneCopyText = function () {
    var lb = '\r\n';
    var string = 'git clone https://github.com/' +
      DBC.userName + '/' + DBC.instance.getRepoName() + '.git' + lb +
      'cd ' + DBC.instance.getRepoName() + lb +
      'git checkout ' + DBC.getNewBranchString() + DBC.getBranchName() + lb;
    if (DBC.shouldUseBranchForPR()) {
      string += 'echo \':)\' >> README.md' + lb +
        'git add -u' + lb +
        'git commit -m \'a friendlier README\'' + lb;
    }
    string += 'git push origin ' + DBC.getBranchName() + ';';
    return string;
  };

  DBC.createNewBranch = function (count) {
    loading('creatingNewBranchFromDemo', true);
    count = count || 0;
    var acv = DBC.instance.contextVersion.getMainAppCodeVersion();
    var completeRepoName = acv.attrs.repo.split('/');
    var repoOwner = completeRepoName[0];
    var repoName = completeRepoName[1];
    var branchName = DBC.getBranchName();
    if (count) {
      branchName += '-' + count;
    }
    if (demoFlowService.shouldAddPR()) {
      return getBranchForPR(DBC.instance);
    }
    return github.createNewBranch(repoOwner, repoName, acv.attrs.commit, branchName)
      .catch(function (err) {
        if (err.message.match(/reference already exists/gi)) {
          return DBC.createNewBranch(++count);
        }
        errs.handler(err);
      });
  };

  DBC.onClipboardEvent = function (err) {
    if (err) {
      DBC.clipboardText = 'Could not copy text';
    } else {
      DBC.clipboardText = 'Copied!';
    }
  };
}
