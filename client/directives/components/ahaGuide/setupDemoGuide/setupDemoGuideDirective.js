'use strict';

require('app')
  .directive('setupDemoGuide', setupDemoGuide);

function setupDemoGuide(
  demoRepos,
  errs,
  loading,
  ModalService
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
          .then(function (repoBuildAndBranch) {
            return ModalService.showModal({
              controller: 'SetupServerModalController',
              controllerAs: 'SMC',
              templateUrl: 'setupServerModalView',
              inputs: angular.extend({
                dockerfileType: false,
                instanceName: null,
                repo: null,
                build: null,
                masterBranch: null,
                defaults: {}
              }, repoBuildAndBranch)
            });
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
