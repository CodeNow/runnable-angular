'use strict';

require('app')
  .directive('dnsConfiguration', dnsConfiguration);

/*
 * This directive requires the following values to be on data:
 *  branch,
 *  commit,
 *  latestCommit,
 */
function dnsConfiguration() {
  return {
    restrict: 'A',
    templateUrl: 'dnsConfigurationView',
    controller: 'DNSConfigurationController',
    controllerAs: 'DCC',
    bindToController: true,
    scope: {
      instance: '='
    },
    link: function ($scope, element, attrs) {
      var initialClassName = element[0].className;
      $scope.$watch('getWorstStatusClass()', function (newVal) {
        element[0].className = initialClassName + ' ' + newVal;
      });

      $scope.getWorstStatusClass = function () {
        var worstStatus = 'gray';
        if (!$scope.DCC.filteredDependencies) {
          return worstStatus;
        }
        $scope.DCC.filteredDependencies.some(function (dependency) {
          if (dependency.instance.destroyed) {
            return false;
          }
          var status = dependency.instance.status();
          if (['buildFailed', 'crashed', 'neverStarted'].includes(status)) {
            worstStatus = 'red';
            return true;
          }
          if (worstStatus !== 'red' && ['building', 'starting'].includes(status)) {
            worstStatus = 'orange';
          }
        });
        return worstStatus;
      };
    }
  };
}
