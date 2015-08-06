'use strict';

require('app')
  .directive('repositoryDetailsModal', repositoryDetailsModal);
/**
 * directive repositoryDetailsModal
 * @ngInject
 */
function repositoryDetailsModal(
) {
  return {
    restrict: 'A',
    templateUrl: 'repositoryDetailsModalView',
    scope: {
      data: '=',
      actions: '=',
      defaultActions: '='
    },
    link: function ($scope, element, attrs) {
      // Add thing
    }
  };
}
