'use strict';

require('app')
  .directive('setupDemoGuide', setupDemoGuide);

function setupDemoGuide(
  $rootScope,
  $state,
  ahaGuide,
  demoFlowService,
  demoRepos,
  errs,
  loading
) {
  return {
    restrict: 'A',
    templateUrl: 'templateIntroView',
    scope: true,
    link: function ($scope) {
      $scope.demoStacks = demoRepos.demoStacks;

      $scope.createDemo = function (stackKey) {
        loading('startDemo', true);
        return demoRepos.createDemoApp(stackKey)
          .then(function (instance) {
            return $state.go('base.instances.instance', {
              instanceName: instance.attrs.name
            });
          })
          .catch(errs.handler)
          .finally(function () {
            loading('startDemo', false);
          });
      };

      $scope.skipDemo = function () {
        $rootScope.$broadcast('demoService::hide');
        demoFlowService.setUsingDemoRepo(false);
      };
    }
  };
}
