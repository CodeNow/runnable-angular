'use strict';

require('app')
  .controller('EnvironmentController', EnvironmentController);
/**
 * EnvironmentController
 * @constructor
 * @export
 * @ngInject
 */
function EnvironmentController(
  $scope,
  $timeout,
  createNewInstance,
  errs,
  eventTracking,
  favico,
  fetchContexts,
  fetchStackInfo,
  fetchInstances,
  pageName,
  promisify,
  $rootScope,
  $q,
  user,
  $interpolate,
  helpCards
) {
  favico.reset();
  pageName.setTitle('Configure - Runnable');
  $scope.data = {
    instances: null
  };
  $scope.state = {
    validation: {
      env: {}
    },
    helpCard: null
  };

  $scope.help = helpCards.cards;
  $scope.helpCards = helpCards;

  $scope.alert = null;

  $scope.$on('alert', function (evt, data) {
    $scope.alert = data;
    $timeout(function () {
      $scope.alert = null;
    }, 5000);
  });

  $scope.helpPopover = {
    data: $scope.help,
    actions: {
      ignoreHelp: function (help) {
        helpCards.ignoreCard(help);
        $rootScope.$broadcast('close-popovers');
      },
      getHelp: function (help) {
        helpCards.activeCard = help;
        $rootScope.$broadcast('close-popovers');
      }
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
      var instance = user.newInstance({
        name: name,
        owner: {
          username: $rootScope.dataApp.data.activeAccount.oauthName()
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
        .then(function () {
          $rootScope.$broadcast('alert', {
            type: 'success',
            text: 'Container added successfully.'
          });
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
  $q.all({
    stacks: fetchStackInfo(),
    deps: fetchInstances({ githubUsername: 'HelloRunnable' }),
    sourceContexts: fetchContexts({ isSource: true }),
    instances: fetchInstances({ masterPod: true })
  })
    .then(function (data) {

      data.instances.forEach(function (instance) {
        helpCards.triggerCard('missingDependency', {
          instance: instance,
          dependency: 'MongoDB'
        });
        helpCards.triggerCard('association', {
          instance: instance,
          association: 'MongoDB'
        });
      });

      $scope.data.stacks = data.stacks;
      $scope.data.allDependencies = data.deps;
      $scope.data.sourceContexts = data.sourceContexts;
      $scope.data.instances = data.instances;
      $scope.data.loadingNewServers = false;
    })
    .catch(errs.handler);

}
