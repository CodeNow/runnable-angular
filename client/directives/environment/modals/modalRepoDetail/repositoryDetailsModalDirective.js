'use strict';

require('app')
  .directive('repositoryDetailsModal', repositoryDetailsModal);
/**
 * directive repositoryDetailsModal
 * @ngInject
 */
function repositoryDetailsModal(
  $q
) {
  return {
    restrict: 'A',
    templateUrl: 'repositoryDetailsModalView',
    scope: {
      appCodeVersion: '=data',
      defaultActions: '='
    },
    link: function ($scope, element, attrs) {
      $scope.actions = {
        create: $q.reject(new Error('This should not be called!')),
        remove: $q.reject(new Error('This should not be called!')),
        update: $q.when(true)
      };
      $scope.data = {
        repo: $scope.appCodeVersion.githubRepo,
        gitDataOnly: true
      };
    }
  };
}
