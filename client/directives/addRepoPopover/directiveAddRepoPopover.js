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
  QueryAssist,
  fetchUser,
  $rootScope,
  $state,
  $stateParams,
  user
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

      function fetchInstance(cb) {
        new QueryAssist($scope.repoListPopover.data.user, cb)
          .wrapFunc('fetchInstances')
          .query({
            githubUsername: $stateParams.userName,
            name: $stateParams.instanceName
          })
          .cacheFetch(function (instances, cached, cb) {
            if (!cached && !instances.models.length) {
              return cb(new Error('Instance not found'));
            }
            var instance = instances.models[0];
            $scope.repoListPopover.data.instance = instance;
            $scope.repoListPopover.data.build = instance.build;
          })
          .resolve(function (err, instances, cb) {
            var instance = instances.models[0];
            // if (!keypather.get(instance, 'containers.models') || !instance.containers.models.length) {
            //   return cb(new Error('instance has no containers'));
            // }
            cb(err);
          })
          .go();
      }

      function fetchBuild(cb) {
        if (!$stateParams.buildId) {
          return fetchInstance(cb);
        }
        new QueryAssist($scope.repoListPopover.data.user, cb)
          .wrapFunc('fetchBuild')
          .query($stateParams.buildId)
          .cacheFetch(function (build, cached, cb) {
            $scope.repoListPopover.data.build = build;
            cb();
          })
          .resolve(function (err, build, cb) {
            if (err) { throw err; }
            cb();
          })
          .go();
      }

      /**
       * Models in build.contextVersions collection will
       * have empty appCodeVersion collections by default.
       * Perform fetch on each contextVersion to populate
       * appCodeVersions collection
       */
      function fetchBuildContextVersions(cb) {
        var build = $scope.repoListPopover.data.build;
        if (!build.contextVersions.models[0]) { throw new Error('build has 0 contextVersions'); }
        build.contextVersions.models[0].fetch(function (err) {
          if (err) { throw err; }
          cb();
        });
      }

      function getOwnerRepoQuery(user, userName, cb) {
        if (userName === user.attrs.accounts.github.username) {
          // does $stateParam.username match this user's username
          return new QueryAssist(user, cb).wrapFunc('fetchGithubRepos');
        } else {
          return new QueryAssist(user.newGithubOrg(userName), cb).wrapFunc('fetchRepos');
        }
      }

      function fetchAllOwnerRepos(cb) {
        $scope.loading = true;
        function fetchPage(page) {
          var userOrOrg = getOwnerRepoQuery(
            $scope.repoListPopover.data.user,
            $stateParams.userName,
            cb
          );
          userOrOrg
            .query({
              page: page,
              sort: 'updated'
            })
            .cacheFetch(function (githubRepos, cached, cb) {})
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
              // recursive until result set returns fewer than
              // 100 repos, indicating last paginated result
              if (githubRepos.models.length < 100) {
                $scope.loading = false;
                cb();
              } else {
                fetchPage(page + 1);
              }
            })
            .go();
        }
        fetchPage(1);
      }

      async.series([
        function (cb) {
          fetchUser(function (err, user) {
            if (err) { return cb(err); }
            $scope.user = user;
            $scope.repoListPopover.data.user = user;
            cb();
          });
        },
        fetchBuild,
        fetchBuildContextVersions,
        fetchAllOwnerRepos
      ]);
    }
  };
}
