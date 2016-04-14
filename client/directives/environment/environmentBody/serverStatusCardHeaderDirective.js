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
      instance: '=',
      repo: '=',
      noTouching: '=?',
      inModal: '=?',
      SMC: '=? serverModalController'
    },
    templateUrl: 'serverStatusCardHeaderView',
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
                    .then(function () {
                      $rootScope.$broadcast('alert', {
                        type: 'deleted',
                        text: 'Container Deleted'
                      });
                    })
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
