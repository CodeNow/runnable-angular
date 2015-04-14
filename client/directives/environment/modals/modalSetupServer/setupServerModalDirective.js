'use strict';

require('app')
  .directive('setupServerModal', setupServerModal);
/**
 * @ngInject
 */
function setupServerModal(
  errs,
  fetchOwnerRepos,
  fetchStackAnalysis,
  hasKeypaths,
  keypather,
  promisify,
  $q,
  $log
) {
  return {
    restrict: 'A',
    templateUrl: 'setupServerModalView',
    scope: {
      actions: '=',
      data: '=',
      defaultActions: '='
    },
    link: function ($scope, elem, attrs) {
      $scope.serverSetupPage = 1;
      $scope.state = {};
      $scope.selectRepo = function (repo) {
        if ($scope.repoSelected) { return; }
        $scope.repoSelected = true;
        repo.isAdded = true;
        return promisify(repo.branches, 'fetch')()
          .then(function () {
            return $scope.actions.fetchStackData(repo);
          })
          .then(function () {
            $scope.state.repo = repo;
          })
          .catch(function (err) {
            repo.isAdded = false;
            errs.handler(err);
          })
          .finally(function () {
            $scope.repoSelected = false;
          });
      };


    }
  };
}
