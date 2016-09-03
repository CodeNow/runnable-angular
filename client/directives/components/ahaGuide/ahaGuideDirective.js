'use strict';

require('app')
  .directive('ahaGuideDirective', ahaGuideDirective);

/**
 * @ngInject
 */
function ahaGuideDirective(

) {
  return {
    restrict: 'A',
    templateUrl: 'ahaGuideView',
    controller: 'AhaGuideController',
    controllerAs: 'AGC',
    scope: {
      stepIndex: '=',
      subStep: '@',
      subStepIndex: '=',
      errorState: '=?'
    },
    link: function ($scope, elem, attrs) {}
  };
}
