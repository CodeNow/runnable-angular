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
  favico,
  fetchInstancesByPod,
  pageName,
  $rootScope,
  helpCards,
  $window,
  $state,
  ModalService
) {
  var EC = this;
  EC.triggerModal = {
    newContainer: function () {
      return ModalService.showModal({
        controller: 'NewContainerModalController',
        controllerAs: 'NCMC',
        templateUrl: 'newContainerModalView'
      });
    },
    repoContainer: function () {
      $rootScope.$broadcast('close-popovers');
      ModalService.showModal({
        controller: 'SetupServerModalController',
        controllerAs: 'SMC',
        templateUrl: 'setupServerModalView'
      });
    }
  };
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
    if ($window.scrollY > 60) {
      newVal = true;
    }
    if ($scope.helpUndock !== newVal) {
      $scope.helpUndock = newVal;
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

}
