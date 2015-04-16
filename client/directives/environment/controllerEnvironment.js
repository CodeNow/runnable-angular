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
    dataModalEditServer: {
      portTagOptions: {
        breakCodes: [
          13, // return
          32, // space
          44, // comma (opera)
          188 // comma (mozilla)
        ],
        texts: {
          'inputPlaceHolder': 'Add ports here',
          maxInputLength: 5,
          onlyDigits: true
        },
        tags: new JSTagsCollection([])
      }
    }
  };
  $scope.state = {
    newServers: []
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
        $scope.state.stack = $scope.data.stacks.find(hasKeypaths({
          'key': data.languageFramework.toLowerCase()
        })) || $scope.data.stacks[0];
        setStackSelectedVersion($scope.state.stack, data.version);
      });
    },
    addNewServer: function (newServerModel, cb) {
      $scope.state.newServers.push(newServerModel);
      return (typeof cb === 'function') ? cb() : null;
    }
  };
  fetchStackInfo().then(function (stacks) {
    console.log(stacks);
    keypather.set($scope, 'data.stacks', stacks);
  }).catch(errs.handler);

  $scope.$on('$destroy', function () {
  });

}
