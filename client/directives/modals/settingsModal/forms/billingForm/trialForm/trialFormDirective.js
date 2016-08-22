'use strict';

require('app').directive('trialForm', trialForm);

function trialForm(
  $localStorage,
  $rootScope,
  keypather,
  ModalService,
  currentOrg
) {
  return {
    restrict: 'A',
    templateUrl: 'trialForm',
    scope: {
      fromNotification: '=?',
      fromModal: '=?'
    },
    link: function ($scope) {
      $scope.currentOrg = currentOrg;
      $scope.actions = {
        openSettingsModal: function (tabName, subTab) {
          keypather.set($localStorage, 'hasDismissedTrialNotification.' + currentOrg.github.attrs.id, true);
          subTab = subTab || '';
          $rootScope.$broadcast('close-popovers');
          ModalService.showModal({
            controller: 'SettingsModalController',
            controllerAs: 'SEMC',
            templateUrl: 'settingsModalView',
            inputs: {
              tab: tabName,
              subTab: subTab
            }
          });
        }
      };
    }
  };
}
