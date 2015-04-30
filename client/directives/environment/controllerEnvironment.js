'use strict';

require('app')
  .controller('ControllerEnvironment', ControllerEnvironment);
/**
 * ControllerEnvironment
 * @constructor
 * @export
 * @ngInject
 */
function ControllerEnvironment(
  $scope,
  $state,
  $timeout,
  createNewInstance,
  errs,
  eventTracking,
  favico,
  fetchContexts,
  getNewForkName,
  pFetchUser,
  fetchStackInfo,
  keypather,
  fetchInstances,
  promisify,
  copySourceInstance,
  $rootScope
) {
  favico.reset();
  $scope.data = {
    instances: []
  };
  $scope.state = {
    validation: {
      env: {}
    }
  };

  $scope.actions = {
    deleteServer: function (server) {
      $rootScope.$broadcast('close-popovers');
      $timeout(function () {
        if (confirm('Are you sure you want to delete this container?')) {
          promisify(server.instance, 'destroy')()
            .catch(errs.handler);
        }
      });
    },
    createAndBuild: function (createPromise, name) {
      $rootScope.$broadcast('close-modal');

      eventTracking.triggeredBuild(false);
      var instance = $rootScope.dataApp.data.user.newInstance({
        name: name,
        owner: {
          username: keypather.get($rootScope, 'dataApp.data.activeAccount.accounts.github.username')
        }
      }, { warn: false });
      $scope.data.instances.add(instance);

      createPromise
        .then(function (newServerModel) {
          return createNewInstance(
            $rootScope.dataApp.data.activeAccount,
            newServerModel.build,
            newServerModel.opts,
            instance
          );
        })
        .catch(function (err) {
          errs.handler(err);
          // Remove it from the servers list
          instance.dealloc();
          //dealloc
        });
    }
  };

  $scope.data.loadingNewServers = true;
  fetchStackInfo()
    .then(function (stacks) {
      keypather.set($scope, 'data.stacks', stacks);
      return fetchInstances({
        masterPod: true
      });
    })
    .then(function (instances) {
      $scope.data.instances = instances;
      $scope.data.loadingNewServers = false;
    })
    .catch(errs.handler);

  pFetchUser()
    .then(function (user) {
      $scope.user = user;
    });
  fetchInstances({ githubUsername: 'HelloRunnable' })
    .then(function (deps) {
      keypather.set($scope, 'data.allDependencies', deps);
    })
    .catch(errs.handler);

  fetchContexts({
    isSource: true
  })
    .then(function (sourceContexts) {
      $scope.data.sourceContexts = sourceContexts;
    });
}
