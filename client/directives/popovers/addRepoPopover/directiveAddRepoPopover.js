'use strict';

require('app')
  .directive('addRepoPopover', addRepoPopover);
/**
 * @ngInject
 */
function addRepoPopover(
  keypather,
  pick,
  $rootScope,
  pFetchUser,
  fetchOwnerRepos,
  promisify,
  $stateParams,
  errs
) {
  return {
    restrict: 'E',
    templateUrl: 'viewAddRepoPopover',
    scope: {
      show: '=',
      contextVersion: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.repoListPopover = {
        data: {},
        actions: {}
      };

      $scope.repoListPopover.data.show = false;
      // sync w/ shared scope property
      $scope.$watch('show', function (n) {
        $scope.repoListPopover.data.show = n;
      });
      $scope.repoListPopover.data.showFilter = false;
      $scope.repoListPopover.data.repoFilter = '';
      // reset modal filter when opening (not when closing)
      $scope.$watch('repoListPopover.data.show', function (n, p) {
        if (n === true && p === false) {
          // was hidden, is now showing
          $scope.repoListPopover.data.showFilter = false;
          $scope.repoListPopover.data.repoFilter = '';
        }
      });

      /**
       * Create a new contextVersion->appCodeVersion
       * representing the repo we just selected
       */
      $scope.repoListPopover.actions.addRepo = function (repo) {
        // close this and other popover
        $rootScope.$broadcast('app-document-click');
        var acv = $scope.contextVersion.newAppCodeVersion({
          repo: repo.attrs.full_name,
          branch: repo.attrs.default_branch
        }, { warn: false });
        acv.githubRepo.reset(repo.json());
        var branch = acv.githubRepo.newBranch(repo.attrs.default_branch);
        promisify(
          branch.commits,
          'fetch'
        )().then(function fetchLatestCommits() {
          if (branch.commits.models.length === 0) { throw new Error('repo has 0 commits'); }
          var latestCommit = branch.commits.models[0];
          acv.extend({
            commit: latestCommit.attrs.sha
          });
          return acv;
        }).then(function createAppCodeVersion() {
          var body = pick(acv.json(), [
            'repo',
            'branch',
            'commit'
          ]);
          // acv
          return promisify($scope.contextVersion.appCodeVersions, 'create')(body)
            .then(function (acv) {
              return acv;
            });
        });
      };

      function setActiveBranch(acv, activeBranch) {
        var githubRepo = acv.githubRepo;
        githubRepo.branches.add(activeBranch);
        // reset githubRepo state
        keypather.set(githubRepo, 'state.activeBranch', activeBranch);
        keypather.set(githubRepo, 'state.selectedBranch', activeBranch);
        // reset branch state
        activeBranch.state = {};
        return activeBranch;
      }

      /**
       * Models in build.contextVersions collection will
       * have empty appCodeVersion collections by default.
       * Perform fetch on each contextVersion to populate
       * appCodeVersions collection
       */
      $scope.repoListPopover.data.contextVersion = $scope.contextVersion;
      pFetchUser(
      ).then(function (user) {
        $scope.user = user;
        $scope.repoListPopover.data.user = user;
      }).then(function () {
        return promisify($scope.contextVersion, 'fetch')();
      }).then(function () {
        return fetchOwnerRepos($stateParams.userName);
      }).then(function (githubRepos) {
        $scope.repoListPopover.data.githubRepos = githubRepos;
      }).catch(errs.handler);
    }
  };
}
