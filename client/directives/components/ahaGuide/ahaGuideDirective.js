'use strict';

require('app')
  .directive('ahaGuideDirective', ahaGuideDirective);

/**
 * @ngInject
 */
function ahaGuideDirective(
  $window
) {
  return {
    restrict: 'A',
    templateUrl: 'ahaGuideView',
    controller: 'AhaGuideController',
    controllerAs: 'AHA',
    scope: {
      stepIndex: '=',
      subStepIndex: '='
    },
    link: function ($scope) {

    }
  };
}
