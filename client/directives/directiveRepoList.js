require('app')
  .directive('repoList', repoList);
/**
 * @ngInject
 */
function repoList (
  $rootScope
) {
  return {
    restrict: 'E',
    scope: {
      build: '='
    },
    templateUrl: 'viewRepoList',
    replace: true,
    link: function ($scope, elem) {
      $scope.$watch('build.contextVersions.models[0]', function (n) {
        if (n && n.fetch) {
          n.fetch(function (err) {
            if (err) {
              throw err;
            }
            $rootScope.safeApply();
            console.log(n.appCodeVersions.models);
          });
        }
      });
    }
  };
}