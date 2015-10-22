'use strict';

require('app')
  .directive('setupTemplateModal', setupTemplateModal);
/**
 * @ngInject
 */
function setupTemplateModal(
) {
  return {
    restrict: 'A',
    templateUrl: 'setupTemplateModalView',
    scope: true
  };
}
