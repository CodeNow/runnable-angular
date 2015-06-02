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
  fetchInstances,
  fetchInstancesByPod,
  keypather,
  pageName,
  promisify,
  $rootScope,
  $q,
  user,
  helpCards,
  $window,
  $state
) {
  $scope.$state = $state;
  favico.reset();
  pageName.setTitle('Configure - Runnable');
  $scope.data = {
    helpCards: helpCards
  };
  fetchInstancesByPod($state.userName)
    .then(function (instances) {
      $scope.data.instances = instances;
    });

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
            .catch(errs.handler);
          helpCards.refreshAllCards();
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
      $rootScope.dataApp.creatingInstance = !keypather.get($scope, 'data.instances.models.length');
      $scope.data.instances.add(instance);
      var unwatch = $scope.$on('$destroy', function cleanUp() {
        $rootScope.dataApp.creatingInstance = false;
        if (!instance.destroyed) {
          unwatch();
          instance.dealloc();
        }
      });
      helpCards.hideActiveCard();

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
        })
        .finally(function () {
          $rootScope.dataApp.creatingInstance = false;
          unwatch();
        });
    }
  };

  $scope.data.loadingNewServers = true;
  $q.all({
    deps: fetchInstances({ githubUsername: 'HelloRunnable' }),
    sourceContexts: fetchContexts({ isSource: true })
  })
    .then(function (data) {
      $scope.data.allDependencies = data.deps;
      $scope.data.sourceContexts = data.sourceContexts;
      $scope.data.loadingNewServers = false;
    })
    .catch(errs.handler);

}
