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
  $rootScope,
  $scope,
  $state,
  $timeout,
  $window,
  errs,
  favico,
  fetchUser,
  fetchInstancesByPod,
  fetchOrgMembers,
  helpCards,
  keypather,
  ModalService,
  pageName
) {
  var EC = this;

  EC.showInviteButton = false;
  fetchUser()
    .then(function (user) {
      var username = keypather.get(user, 'attrs.accounts.github.username');
      EC.showInviteButton = (username !== $state.params.userName);
    });

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
    },
    inviteTeammate: function () {
      return fetchOrgMembers($state.params.userName, true)
        .then(function (members) {
          return ModalService.showModal({
            controller: 'InviteModalController',
            controllerAs: 'IMC',
            templateUrl: 'inviteModalView',
            inputs: {
              teamName: $state.params.userName,
              unInvitedMembers: members.uninvited
            }
          });
        })
        .catch(errs.handler);
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
