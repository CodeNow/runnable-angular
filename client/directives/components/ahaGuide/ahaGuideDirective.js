'use strict';

require('app')
  .directive('ahaGuide', ahaGuide);

/**
 * @ngInject
 */
function ahaGuide(

) {
  return {
    restrict: 'A',
    templateUrl: 'ahaGuideView',
    controller: 'AhaGuideController',
    controllerAs: 'AGC',
    bindToController: true,
    scope: {
      subStep: '@',
      subStepIndex: '=?',
      errorState: '=?'
    }
  };
}
