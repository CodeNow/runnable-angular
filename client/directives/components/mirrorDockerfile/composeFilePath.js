'use strict';

require('app')
  .directive('composeFilePath', composeFilePath);

/**
 * @ngInject
 */
function composeFilePath(
) {
  return {
    restrict: 'A',
    templateUrl: 'composeFilePathView',
    scope: {
      pathEnabled: '=?',
      type: '@',
      branchName: '=',
      fullRepo: '='
    }
  };
}
