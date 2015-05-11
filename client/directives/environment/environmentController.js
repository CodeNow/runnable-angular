'use strict';

var helpCards = require('../../config/helpCards.js');

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
  $interpolate
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

  $scope.help = {
    general: helpCards.general,
    triggered: []
  };

  $scope.helpPopover = {
    data: $scope.help,
    actions: {
      ignoreHelp: function (help) {
        console.log('TODO: Ignore help', help);
        $rootScope.$broadcast('close-popovers');
      },
      getHelp: function (help) {
        $scope.state.helpCard = help;
        $rootScope.$broadcast('close-popovers');
      }
    }
  };

  function triggerHelp(id, data){
    var helpCard = angular.copy(helpCards.triggered[id]);
    helpCard.label = $interpolate(helpCard.label)(data);
    helpCard.helpTop = $interpolate(helpCard.helpTop)(data);
    Object.keys(helpCard.helpPopover).forEach(function (key) {
      helpCard.helpPopover[key] = $interpolate(helpCard.helpPopover[key])(data);
    });

    helpCard.data = data;
    $scope.help.triggered.push(helpCard);
  }



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
        triggerHelp('association', {
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
