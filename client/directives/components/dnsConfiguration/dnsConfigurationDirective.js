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
      $scope.$watch('DCC.getWorstStatusClass()', function (newVal) {
        element[0].className = initialClassName + ' ' + newVal;
      });
    }
  };
}
