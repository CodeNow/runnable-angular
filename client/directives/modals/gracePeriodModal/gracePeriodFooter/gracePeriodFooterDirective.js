'use strict';

require('app').directive('gracePeriodFooter', gracePeriodFooter);

function gracePeriodFooter(
  $rootScope,
  promisify,
  errs
) {
  return {
    restrict: 'A',
    templateUrl: 'gracePeriodFooterView',
    scope: {
      close: '=?',
      hideChooseOrg: '=?'
    },
    link: function ($scope) {
      $scope.logout = function () {
        promisify($rootScope.dataApp.data.user, 'logout')().then(function () {
          window.location = '/';
        }).catch(errs.handler);
      };

      $scope.goToOrgSelect = function () {
        if ($scope.close) {
          $scope.close();
        }
        window.location = '/orgSelect';
      };
    }
  };
}
