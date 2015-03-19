'use strict';

require('app')
  .directive('setupRepositorySelect', setupRepositorySelect);
/**
 * @ngInject
 */
function setupRepositorySelect(
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'viewSetupRepositorySelect',
    scope: {
      data: '=',
      actions: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
    }
  };
}
