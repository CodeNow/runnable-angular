'use strict';

require('app')
  .directive('serverStatusCardHeader', serverStatusCardHeader);
/**
 * @ngInject
 */
function serverStatusCardHeader(
  $rootScope,
  errs,
  helpCards,
  ModalService,
  promisify
) {
  return {
    restrict: 'E',
    replace: false,
    scope: {
      instance: '= instance',
      noTouching: '=? noTouching',
      inModal: '=? inModal'
    },
    templateUrl: function (elem, attrs) {
      if ($rootScope.featureFlags.cardStatus) {
        return 'serverStatusCardHeaderViewCardStatus';
      }
      return 'serverStatusCardHeaderView';
    },
    link: function ($scope, elem, attrs) {
      $scope.popoverServerActions = {
        openEditServerModal: function (defaultTab) {
          $rootScope.$broadcast('close-popovers');
          ModalService.showModal({
            controller: 'EditServerModalController',
            controllerAs: 'SMC',
            templateUrl: 'editServerModalView',
            inputs: {
              tab: defaultTab,
              instance: $scope.instance
            }
          })
            .catch(errs.handler);
        },
        deleteServer: function () {
          var instance = $scope.instance;
          $rootScope.$broadcast('close-popovers');
          return ModalService.showModal({
            controller: 'ConfirmationModalController',
            controllerAs: 'CMC',
            templateUrl: 'confirmDeleteServerView'
          })
            .then(function (modal) {
              return modal.close.then(function (confirmed) {
                if (confirmed) {
                  promisify(instance, 'destroy')()
                    .catch(errs.handler);
                  helpCards.refreshAllCards();
                }
                return confirmed;
              });
            })
            .catch(errs.handler);
        }
      };
    }
  };
}
