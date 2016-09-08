'use strict';

require('app')
  .directive('serverStatusCardHeader', serverStatusCardHeader);
/**
 * @ngInject
 */
function serverStatusCardHeader(
  $rootScope,
  errs,
  ModalService,
  promisify
) {
  return {
    restrict: 'E',
    replace: false,
    scope: {
      instance: '=',
      instanceName: '=?',
      noTouching: '=?',
      inModal: '=?',
      SMC: '=? serverModalController'
    },
    templateUrl: 'serverStatusCardHeaderView',
    link: function ($scope, elem, attrs) {
      $scope.getName = function () {
        if ($scope.instance) {
          return $scope.instance.getMasterPodName();
        }
        return $scope.instanceName;
      };
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
