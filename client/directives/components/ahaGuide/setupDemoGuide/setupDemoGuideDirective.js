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
        var loadingName = 'startDemo-' + stackKey;
        loading(loadingName, true);
        return demoRepos.createDemoApp(stackKey)
          .then(function (instance) {
            ahaGuide.endGuide({
              hasAha: false,
              hasConfirmedSetup: true,
              hasCompletedDemo: false
            });
            demoFlowService.setIsUsingDemoRepo(true);
            $rootScope.$broadcast('demoService::hide');
            $rootScope.$broadcast('demo::building', instance);
            return $state.go('base.instances.instance', {
              instanceName: instance.attrs.name
            });
          })
          .catch(errs.handler)
          .finally(function () {
            loading('startDemo', false);
            loading(loadingName, false);
          });
      };

      $scope.skipDemo = function () {
        $rootScope.$broadcast('demoService::hide');
        demoFlowService.setIsUsingDemoRepo(false);
      };
    }
  };
}
