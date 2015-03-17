'use strict';

require('app')
  .directive('gsRepositorySelector', gsRepositorySelector);
/**
 * @ngInject
 */
function gsRepositorySelector(
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalRepositorySelector',
    scope: {
      data: '=',
      actions: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
    }
  };
}
