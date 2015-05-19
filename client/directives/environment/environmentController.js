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
  helpCards,
  $window
) {
  favico.reset();
  pageName.setTitle('Configure - Runnable');
  $scope.data = {
    instances: null,
    helpCards: helpCards
  };
  $scope.state = {
    validation: {
      env: {}
    },
    helpCard: null,
    newServerButton: {
      active: false
    }
  };

  $scope.help = helpCards.cards;
  $scope.helpCards = helpCards;

  helpCards.clearAllCards();

  $scope.helpUndock = false;

  var scrollHelper = function () {
    var newVal = false;
    if ($window.scrollY > 150) {
      newVal = true;
    }
    if ($scope.helpUndock !== newVal) {
      $scope.helpUndock = newVal;
      $timeout(angular.noop);
    }
  };
  $scope.$on('helpCardScroll:enable', function () {
    $window.addEventListener('scroll', scrollHelper);
  });
  $scope.$on('helpCardScroll:disable', function () {
    $window.removeEventListener('scroll', scrollHelper);
  });

  $scope.$on('$destroy', function () {
    $window.removeEventListener('scroll', scrollHelper);
  });

  $scope.$watch('helpCards.getActiveCard().targets.newContainer', function (n) {
    if (n) {
      $scope.state.newServerButton.active = true;
    }
  });

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
      },
      getHelp: function (help) {
        helpCards.setActiveCard(help);
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
            .then(function () {
              helpCards.refreshAllCards();
            })
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

      $rootScope.$broadcast('alert', {
        type: 'success',
        text: 'Your new container is building.'
      });

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
          helpCards.refreshAllCards();
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
      $scope.data.stacks = data.stacks;
      $scope.data.allDependencies = data.deps;
      $scope.data.sourceContexts = data.sourceContexts;
      $scope.data.instances = data.instances;
      $scope.data.loadingNewServers = false;
    })
    .catch(errs.handler);

}
