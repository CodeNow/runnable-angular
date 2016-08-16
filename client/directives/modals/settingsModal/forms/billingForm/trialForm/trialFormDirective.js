'use strict';

require('app').directive('trialForm', trialForm);

function trialForm(
  $localStorage,
  $rootScope,
  ModalService
) {
  return {
    restrict: 'A',
    templateUrl: 'trialForm',
    scope: {
      fromNotification: '=?',
      fromModal: '=?'
    },
    link: function ($scope) {
      $scope.activeAccount = $rootScope.dataApp.data.activeAccount;
      $scope.actions = {
        openSettingsModal: function (tabName, subTab) {
          $localStorage.hasDismissedTrialNotification = true;
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
