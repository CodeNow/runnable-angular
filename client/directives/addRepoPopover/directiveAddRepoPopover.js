'use strict';

require('app')
  .directive('addRepoPopover', addRepoPopover);
/**
 * @ngInject
 */
function addRepoPopover(
  async,
  keypather,
  pick,
  $rootScope,
  $state,
  $stateParams,
  user,
  pFetchUser,
  fetchInstances,
  fetchBuild,
  fetchOwnerRepos,
  promisify,
  $q,
  errs
) {
  return {
    restrict: 'E',
    templateUrl: 'viewAddRepoPopover',
    scope: {
      show: '='
    },
    link: function ($scope, elem, attrs) {

      // rules for display based on state name
      if ($state.$current.name === 'instance.instance') {
        $scope.enabled = false;
      } else {
        $scope.enabled = true;
      }
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
        var cv = $scope.repoListPopover.data.build.contextVersions.models[0];
        var acv = cv.newAppCodeVersion({
          repo: repo.attrs.full_name,
          branch: repo.attrs.default_branch
        }, { warn: false });
        acv.githubRepo.reset(repo.json());
        var branch = acv.githubRepo.newBranch(repo.attrs.default_branch);
        async.series([
          fetchLatestCommit,
          createAppCodeVersion
        ]);

        function fetchLatestCommit(cb) {
          branch.commits.fetch(function (err) {
            if (err) { throw err; }
            // TODO: how to handle?
            if (branch.commits.models.length === 0) { throw new Error('repo has 0 commits'); }
            var latestCommit = branch.commits.models[0];
            acv.extend({
              commit: latestCommit.attrs.sha
            });
            cb();
          });
        }

        function createAppCodeVersion(cb) {
          var body = pick(acv.json(), [
            'repo',
            'branch',
            'commit'
          ]);
          // acv
          cv.appCodeVersions.create(body, function (err) {
            if (err) { throw err; }
          });
        }
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

      pFetchUser().then(function(user) {
        $scope.user = user;
        $scope.repoListPopover.data.user = user;
        if ($stateParams.buildId) {
          return fetchBuild($stateParams.buildId)
          .then(function(build) {
            $scope.repoListPopover.data.build = build;
          });
        } else {
          return fetchInstances({
            name: $stateParams.instanceName
          })
          .then(function(instance) {
            $scope.repoListPopover.data.instance = instance;
            $scope.repoListPopover.data.build = instance.build;
          });
        }
      }).then(function() {
        /**
         * Models in build.contextVersions collection will
         * have empty appCodeVersion collections by default.
         * Perform fetch on each contextVersion to populate
         * appCodeVersions collection
         */
        var build = $scope.repoListPopover.data.build;
        if (!build.contextVersions.models[0]) { throw new Error('build has 0 contextVersions'); }
        var fetchCV = promisify(build.contextVersions.models[0], 'fetch');
        return $q.all([
          fetchCV(),
          fetchOwnerRepos($stateParams.userName)
        ]);
      }).then(function(githubRepos) {
        $scope.repoListPopover.data.githubRepos = githubRepos;
      }).catch(errs.handler);
    }
  };
}
