'use strict';

require('app')
  .directive('setupDemoGuide', setupDemoGuide);

function setupDemoGuide(
  ahaGuide,
  demoRepos,
  errs,
  loading
) {
  return {
    restrict: 'A',
    templateUrl: 'setupDemoGuideView',
    scope: true,
    link: function ($scope) {
      $scope.demoStacks = demoRepos.demoStacks;

      $scope.createDemo = function (stackKey) {
        loading('startDemo', true);
        var loadingName = 'startDemo-' + stackKey;
        loading(loadingName, true);
        return demoRepos.createDemoApp(stackKey)
          .then(function () {
            return ahaGuide.endGuide();
          })
          .catch(errs.handler)
          .finally(function () {
            loading('startDemo', false);
            loading(loadingName, false);
          });
      };
    }
  };
}
