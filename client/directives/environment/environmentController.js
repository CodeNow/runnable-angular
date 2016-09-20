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
  $q,
  $rootScope,
  $scope,
  $state,
  $timeout,
  ahaGuide,
  currentOrg,
  favico,
  fetchDockerfileForContextVersion,
  fetchOrgMembers,
  fetchUser,
  instancesByPod,
  keypather,
  ModalService,
  pageName
) {
  var EC = this;

  EC.showInviteButton = false;
  EC.isAddingFirstRepo = ahaGuide.isAddingFirstRepo;
  EC.isInGuide = ahaGuide.isInGuide;
  EC.showCreateTemplate = true;
  EC.showOverview = true;
  $scope.$on('ahaGuideEvent', function(event, info) {
    if (info.isClear) {
      EC.errorState = null;
    } else {
      EC.errorState = info.error;
    }
  });

  var unbindUpdateTeammateInvitation = $rootScope.$on('updateTeammateInvitations', function (event, invitesCreated) {
    if (invitesCreated) {
      updateShowInviteButton();
    }
  });
  $scope.$on('$destroy', unbindUpdateTeammateInvitation);

  function updateShowInviteButton() {
    return $q.all({
      user: fetchUser(),
      members: fetchOrgMembers($state.params.userName)
    })
      .then(function (res) {
        var username = keypather.get(res.user, 'attrs.accounts.github.username');
        var isOrg = (username !== $state.params.userName);
        EC.showInviteButton = isOrg && res.members.uninvited.length > 0;
      });
  }

  // On init, determine whether to show invites
  updateShowInviteButton();

  EC.triggerModal = {
    newContainer: function () {
      return ModalService.showModal({
        controller: 'NewContainerModalController',
        controllerAs: 'MC', // Shared
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
      return ModalService.showModal({
        controller: 'InviteModalController',
        controllerAs: 'IMC',
        templateUrl: 'inviteModalView',
        inputs: {
          teamName: $state.params.userName,
          unInvitedMembers: null
        }
      });
    }
  };
  $scope.$state = $state;
  favico.reset();
  pageName.setTitle('Configure - Runnable');
  $scope.data = { };
  $scope.data.instances = instancesByPod;

  var isAddFirstRepo = ahaGuide.isAddingFirstRepo();

  if (isAddFirstRepo && instancesByPod.models.length === 0) {
    EC.showCreateTemplate = false;
    EC.showSidebar = true;
  }

  // Asynchronously fetch the Dockerfile and check for working instances
  instancesByPod.forEach(function (instance) {
    if (instance.hasDockerfileMirroring()) {
      return fetchDockerfileForContextVersion(instance.contextVersion)
        .then(function (dockerfile) {
          instance.mirroredDockerfile = dockerfile;
        });
    }
    // Differentiate between non-fetched and non-existing
    instance.mirroredDockerfile = null;
  });

  $scope.state = {
    validation: {
      env: {}
    },
    newServerButton: {
      active: false
    }
  };

  EC.alert = null;

  $scope.$on('alert', function (evt, data) {
    EC.alert = data;
    if (!data.planChanged) {
      $timeout(function () {
        EC.actions.closeAlert();
      }, 5000);
    }
  });

  EC.actions = {
    closeAlert: function () {
      EC.alert = null;
    },
    goToBilling: function () {
      EC.actions.closeAlert();
      ModalService.showModal({
        controller: 'SettingsModalController',
        controllerAs: 'SEMC',
        templateUrl: 'settingsModalView',
        inputs: {
          tab: 'billing',
          subTab: 'billingForm'
        }
      });
    },
    showSidebar: function () {
      EC.showSidebar = !EC.showSidebar;
      EC.showCreateTemplate = true;
    },
    endGuide: ahaGuide.endGuide
  };


  $scope.$on('showAhaSidebar', EC.actions.showSidebar);
  $scope.$on('showAddServicesPopover', function(event, toggle) {
    EC.showAddServicePopover = toggle;
  });
}
