require('app')
  .directive('runnableAddRepoPopover', RunnableAddRepoPopover);
/**
 * @ngInject
 */
function RunnableAddRepoPopover (
  async,
  QueryAssist,
  $rootScope,
  $state,
  $stateParams,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewAddRepoPopover',
    replace: true,
    scope: {},
    link: function ($scope, elem, attrs) {

      $scope.repoListPopover = {
        data: {},
        actions: {}
      };

      $scope.repoListPopover.data.show = false;
      $scope.repoListPopover.data.showFilter = false;
      $scope.repoListPopover.data.repoFilter = '';

      $scope.repoListPopover.actions.addRepo = function (repo) {
      };

      // rules for display based on state name
      switch ($state.$current.name) {
        case 'instance.instance':
          $scope.enabled = false;
          break;
        case 'instance.edit':
          $scope.enabled = true;
          break;
        case 'instance.setup':
          $scope.enabled = true;
          break;
      }

      function fetchUser (cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {
          })
          .go();
      }

      function fetchBuild (cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchBuild')
          .query($stateParams.buildId)
          .cacheFetch(function (build, cached, cb) {
            $scope.build = build;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, build, cb) {
            if (err) throw err;
            $rootScope.safeApply();
            cb();
          })
          .go();
      }

      function getOwnerRepoQuery (user, build, userName, cb) {
        if (user.isOwnerOf(build)) {
          return new QueryAssist(user, cb).wrapFunc('fetchGithubRepos');
        } else {
          return new QueryAssist(user.newGithubOrg(userName), cb).wrapFunc('fetchRepos');
        }
      }

      function fetchAllOwnerRepos (cb) {
        function fetchPage (page) {
          var userOrOrg = getOwnerRepoQuery(
            $scope.user,
            $scope.build,
            $stateParams.userName,
            cb
          );
          userOrOrg
            .query({
              page: page,
              sort: 'updated'
            })
            .cacheFetch(function (githubRepos, cached, cb) {
            })
            .resolve(function (err, githubRepos, cb) {
              /**
               * Double concat to models arr
               * if logic run twice (cached & non-cached)
               */
              if (!$scope.repoListPopover.data.githubRepos) {
                $scope.repoListPopover.data.githubRepos = githubRepos;
              } else {
                var reposArr = $scope.repoListPopover.data.githubRepos.models.concat(githubRepos.models);
                $scope.repoListPopover.data.githubRepos = $scope.user.newGithubRepos(reposArr, {
                  noStore: true
                });
              }
              $rootScope.safeApply();
              // recursive until result set returns fewer than
              // 100 repos, indicating last paginated result
              if (githubRepos.models.length < 100) {
                cb();
              } else {
                fetchPage(page+1);
              }
            })
            .go();
        }
        fetchPage(0);
      }

      async.series([
        fetchUser,
        fetchBuild,
        fetchAllOwnerRepos
      ]);

    }
  };
}
