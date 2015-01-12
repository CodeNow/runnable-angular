require('app')
  .directive('gsRepoSelector', gsRepoSelector);
/**
 * @ngInject
 */
function gsRepoSelector(
  async,
  keypather,
  errs,
  fetchGSDepInstances,
  fetchStackInfo,
  fetchUser,
  hasKeypaths,
  $stateParams,
  QueryAssist
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalRepoSelector',
    scope: {
      actions: '=',
      data: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
      function fetchStackData(repo, cb) {
        fetchStackInfo(repo, function (err, data) {
          if (err) { return cb(err); }
          $scope.$watch('allDependencies', function (allDeps) {
            if (allDeps) {
              var includedDeps = data.map(function (dep) {
                return allDeps.find(hasKeypaths({'attrs.name': dep}));
              });
              includedDeps.forEach(function (dep) {
                $scope.actions.addDependency(dep);
              });
            }
          });
        });
      }
      $scope.selectRepo = function (repo) {
        fetchStackData(repo.attrs.repo, function (err) {
          errs.handler(err);
          $scope.step = 2;
        });
      };

      function getOwnerRepoQuery(user, userName, cb) {
        if (userName === user.attrs.accounts.github.username) {
          // does $stateParam.username match this user's username
          return new QueryAssist(user, cb).wrapFunc('fetchGithubRepos');
        } else {
          return new QueryAssist(user.newGithubOrg(userName), cb).wrapFunc('fetchRepos');
        }
      }
      function fetchAllOwnerRepos(user, cb) {
        function fetchPage(page) {
          var userOrOrg = getOwnerRepoQuery(
            user,
            $stateParams.userName,
            cb
          );
          userOrOrg
            .query({
              page: page,
              sort: 'updated'
            })
            .cacheFetch(function (githubRepos, cached, cb) {
              /**
               * Double concat to models arr
               * if logic run twice (cached & non-cached)
               */
              if (!$scope.githubRepos) {
                $scope.githubRepos = githubRepos;
              } else {
                var reposArr = $scope.githubRepos.models.concat(githubRepos.models);
                $scope.githubRepos = user.newGithubRepos(reposArr, {
                  noStore: true
                });
              }
              // recursive until result set returns fewer than
              // 100 repos, indicating last paginated result
              if (githubRepos.models.length < 100) {
                $scope.loading = false;
                cb();
              } else {
                fetchPage(page + 1);
              }
            })
            .resolve(function (err, githubRepos, cb) {

            })
            .go();
        }
        fetchPage(1);
      }
      async.waterfall([
        fetchUser,
        fetchAllOwnerRepos
      ]);
    }
  };
}
