'use strict';

require('app')
  .directive('githubIntegration', githubIntegration);
/**
 * @ngInject
 */
function githubIntegration(
) {
  return {
    restrict: 'A',
    templateUrl: 'githubIntegrationView',
    controller: 'GithubIntegrationController',
    controllerAs: 'GIC',
    bindToController: true,
    scope: {
      state: '='
    }
  };
}
