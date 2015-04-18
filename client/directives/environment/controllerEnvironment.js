'use strict';

require('app')
  .controller('ControllerEnvironment', ControllerEnvironment);
/**
 * ControllerEnvironment
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerEnvironment(
  $scope,
  $rootScope,
  $state,
  $stateParams,
  $log,
  errs,
  favico,
  fetchOwnerRepos,
  fetchStackAnalysis,
  fetchStackInfo,
  hasKeypaths,
  keypather,
  fetchInstances,
  pageName,
  JSTagsCollection,
  promisify
) {
  favico.reset();
  $scope.data = {
    newServers: []
  };
  $scope.state = {
    validation: {
      env: {}
    }
  };
  $scope.actions = {
    selectAccount: function (account) {
      $scope.data.activeAccount = account;
      $scope.loading = true;
      $scope.data.githubRepos = null;
      fetchOwnerRepos(account.oauthName())
        .then(function (repoList) {
          $scope.data.githubRepos = repoList;
        })
        .catch(
          errs.handler
        ).finally(function () {
          $scope.loading = false;
        });
    },
    fetchStackData: function (repo) {
      function setStackSelectedVersion(stack, versions) {
        if (versions[stack.key]) {
          stack.suggestedVersion = versions[stack.key];
        }
        if (stack.dependencies) {
          stack.dependencies.forEach(function (childStack) {
            setStackSelectedVersion(childStack, versions);
          });
        }
      }
      return fetchStackAnalysis(repo).then(function (data) {
        console.log(data);
        if (!data.languageFramework) {
          $log.warn('No language detected');
          return;
        }
        repo.stackAnalysis = data;
        var stack = $scope.data.stacks.find(hasKeypaths({
          'key': data.languageFramework.toLowerCase()
        }));
        if (stack) {
          setStackSelectedVersion(stack, data.version);
        }
        return stack;
      });
    },
    getFlattenedSelectedStacks: function (selectedStack) {
      var flattened = selectedStack.name + ' v' + selectedStack.selectedVersion;
      if (selectedStack.dependencies) {
        selectedStack.dependencies.forEach(function (dep) {
          flattened += ', ' + $scope.actions.getFlattenedSelectedStacks(dep);
        });
      }
      return flattened;
    },
    addNewServer: function (newServerModel, cb) {
      $scope.data.newServers.push(newServerModel);
      if (newServerModel.selectedStack.ports) {
        newServerModel.ports = newServerModel.selectedStack.ports.replace(/ /g, '').split(',');
      }
      return (typeof cb === 'function') ? cb() : null;
    },
    saveChangesToServer: function (changes) {
      if (changes.dockerfile) {
        // we need to edit the dockerfile
      }
    }
  };
  fetchStackInfo().then(function (stacks) {
    console.log(stacks);
    keypather.set($scope, 'data.stacks', stacks);
  }).catch(errs.handler);

  $scope.$on('$destroy', function () {
  });

}
