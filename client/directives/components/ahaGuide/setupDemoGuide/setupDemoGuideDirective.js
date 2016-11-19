'use strict';

require('app')
  .directive('setupDemoGuide', setupDemoGuide);

function setupDemoGuide(
  $rootScope,
  $state,
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
          .then(function (instance) {
            $rootScope.$broadcast('demoService::hide');
            return $state.go('base.instances.instance', {
              instanceName: instance.attrs.name
            });
          })
          .catch(errs.handler)
          .finally(function () {
            ahaGuide.endGuide();
            loading('startDemo', false);
            loading(loadingName, false);
          });
      };
    }
  };
}
