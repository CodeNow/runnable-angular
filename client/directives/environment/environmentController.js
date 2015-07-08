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
  fetchStackInfo,
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
  var EC = this;

  EC.$state = $state;
  favico.reset();
  pageName.setTitle('Configure - Runnable');
  EC.data = {
    helpCards: helpCards
  };
  fetchInstancesByPod($state.userName)
    .then(function (instances) {
      EC.data.instances = instances;
    });

  EC.state = {
    validation: {
      env: {}
    },
    helpCard: null,
    newServerButton: {
      active: false
    }
  };

  EC.help = helpCards.cards;
  EC.helpCards = helpCards;

  helpCards.clearAllCards();

  EC.helpUndock = false;

  var scrollHelper = function () {
    var newVal = false;
    if ($window.scrollY > 153) {
      newVal = true;
    }
    if (EC.helpUndock !== newVal) {
      EC.helpUndock = newVal;
      $timeout(angular.noop);
    }
  };
  $scope.$on('helpCardScroll:enable', function () {
    $window.addEventListener('scroll', scrollHelper);
    scrollHelper();
  });
  $scope.$on('helpCardScroll:disable', function () {
    $window.removeEventListener('scroll', scrollHelper);
  });

  $scope.$on('$destroy', function () {
    $window.removeEventListener('scroll', scrollHelper);
  });

  EC.alert = null;

  $scope.$on('alert', function (evt, data) {
    EC.alert = data;
    $timeout(function () {
      EC.alert = null;
    }, 5000);
  });

  EC.helpPopover = {
    data: EC.help,
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

  EC.actions = {
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
      // Save this in case it changes
      var cachedActiveAccount = $rootScope.dataApp.data.activeAccount;
      var instance = $rootScope.dataApp.data.user.newInstance({
        name: name,
        owner: {
          username: cachedActiveAccount.oauthName()
        }
      }, { warn: false });
      $rootScope.dataApp.creatingInstance = !keypather.get($scope, 'data.instances.models.length');
      EC.data.instances.add(instance);
      helpCards.hideActiveCard();

      $rootScope.$broadcast('alert', {
        type: 'success',
        text: 'Your new container is building.'
      });

      createPromise
        .then(function (newServerModel) {
          return createNewInstance(
            cachedActiveAccount,
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
        });
    }
  };

  $q.all({
    deps: fetchInstances({ githubUsername: 'HelloRunnable' }),
    sourceContexts: fetchContexts({ isSource: true }),
    stacks: fetchStackInfo()
  })
    .then(function (data) {
      EC.data.allDependencies = data.deps;
      EC.data.stacks = data.stacks;
      EC.data.sourceContexts = data.sourceContexts;
    })
    .catch(errs.handler);

}
