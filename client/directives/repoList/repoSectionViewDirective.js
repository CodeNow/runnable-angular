'use strict';

require('app')
  .directive('repoSectionView', repoSectionView);

function repoSectionView(
  $rootScope,
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'repoSectionView',
    scope: {
      composeRepo: '@',
      clusters: '='
    },
    link: function (scope) {
      console.log(scope);
    }
  };
}
