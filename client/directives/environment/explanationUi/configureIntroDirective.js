'use strict';

require('app')
  .directive('configureIntro', configureIntro);
/**
 * @ngInject
 */
function configureIntro(setSeenExplanationUi) {
  return {
    restrict: 'A',
    templateUrl: 'configureIntroView',
    link: function (scope) {
      scope.setSeenExplanationUi = setSeenExplanationUi;
    }
  };
}
