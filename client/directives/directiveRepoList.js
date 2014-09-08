require('app')
  .directive('repoList', repoList);
/**
 * @ngInject
 */
function repoList (

) {
  return {
    restrict: 'E',
    scope: {
      instance: '='
    },
    templateUrl: 'viewRepoList',
    replace: true,
    link: function (elem, $scope) {

    }
  };
}