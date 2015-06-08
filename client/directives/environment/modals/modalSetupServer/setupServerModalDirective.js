'use strict';

require('app')
  .directive('setupServerModal', setupServerModal);
/**
 * @ngInject
 */
function setupServerModal(
  createDockerfileFromSource,
  fetchDockerfileFromSource,
  parseDockerfileForDefaults,
  createNewBuild,
  $rootScope,
  errs,
  fetchOwnerRepos,
  fetchStackAnalysis,
  hasKeypaths,
  keypather,
  populateDockerfile,
  promisify,
  $log,
  cardInfoTypes
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
      $scope.state = {
        opts: {
          masterPod: true
        }
      };

      fetchOwnerRepos($rootScope.dataApp.data.activeAccount.oauthName())
        .then(function (repoList) {
          $scope.data.githubRepos = repoList;
        })
        .catch(errs.handler)
        .finally(function () {
          $scope.loading = false;
        });

      function normalizeRepoName(repo) {
        return repo.attrs.name.replace(/[^a-zA-Z0-9-]/g, '-');
      }

      $scope.isRepoAdded = function (repo) {
        // Since the newServers may have faked repos (just containing names), just check the name
        return !!$scope.data.instances.find(function (instance) {
          var repoName = instance.getRepoName();
          if (repoName) {
            return repo.attrs.name === repoName;
          } else {
            return normalizeRepoName(repo) === instance.attrs.name;
          }
        });
      };

      $scope.createServer = function () {
        if (keypather.get($scope.state, 'selectedStack.ports.length')) {
          $scope.state.ports = $scope.state.selectedStack.ports.replace(/ /g, '').split(',');
        }

        var createPromise = createDockerfileFromSource(
          $scope.state.contextVersion,
          $scope.state.selectedStack.key,
          $scope.data.sourceContexts
        )
          .then(function (dockerfile) {
            $scope.state.dockerfile = dockerfile;

            var Repo = cardInfoTypes()['Main Repository'];

            $scope.state.containerFiles = [];

            var repo = new Repo(null, {isMainRepo: true});

            var commands = $scope.state.commands || '';

            repo.name = $scope.state.repo.attrs.name;
            repo.path = $scope.state.dst.replace('/', '');
            repo.commands = commands;

            $scope.state.containerFiles.push(repo);

            return populateDockerfile(
              dockerfile,
              $scope.state
            );
          })
          .then(function () {
            if ($scope.acv.attrs.branch !== $scope.state.branch.attrs.name) {
              return promisify($scope.acv, 'update')({
                repo: $scope.state.repo.attrs.full_name,
                branch: $scope.state.branch.attrs.name,
                commit: $scope.state.branch.attrs.commit.sha
              });
            }
          })
          .then(function () {
            return $scope.state;
          });


        $scope.actions.createAndBuild(createPromise, $scope.state.opts.name);
      };

      $scope.$watch('state.selectedStack', function (n) {
        if (n) {
          return fetchDockerfileFromSource(
            n.key,
            $scope.data.sourceContexts
          )
            .then(function (dockerfile) {
              return parseDockerfileForDefaults(dockerfile, ['run', 'dst']);
            })
            .then(function (defaults) {
              $scope.state.commands = defaults.run.join('\n');
              $scope.state.dst = defaults.dst.length ? defaults.dst[0] : $scope.state.opts.name;
            });
        }
      });

      $scope.selectRepo = function (repo) {
        if ($scope.repoSelected) { return; }
        $scope.repoSelected = true;
        repo.loading = true;
        // Replace any non-word character with a -
        $scope.state.opts.name = normalizeRepoName(repo);
        return $scope.fetchStackData(repo)
          .then(function () {
            return createNewBuild($rootScope.dataApp.data.activeAccount);
          })
          .then(function (buildWithVersion) {
            $scope.state.build = buildWithVersion;
            $scope.state.contextVersion = buildWithVersion.contextVersion;
            return promisify(repo.branches, 'fetch')();
          })
          .then(function (branches) {
            var masterBranch = branches.models.find(hasKeypaths({'attrs.name': repo.attrs.default_branch}));
            $scope.branches = branches;
            $scope.state.branch = masterBranch;
            // Set the repo here so the page change happens after all of these fetches
            $scope.state.repo = repo;
            return promisify($scope.state.contextVersion.appCodeVersions, 'create', true)({
              repo: repo.attrs.full_name,
              branch: masterBranch.attrs.name,
              commit: masterBranch.attrs.commit.sha
            });
          })
          .then(function () {
            $scope.acv = $scope.state.contextVersion.getMainAppCodeVersion();
          })
          .then(function (dockerfile) {
            $scope.state.dockerfile = dockerfile;
          })
          .catch(errs.handler)
          .finally(function () {
            repo.loading = false;
            $scope.repoSelected = false;
          });
      };

      $scope.fetchStackData = function (repo) {
        function setStackSelectedVersion(stack, versions) {
          if (versions[stack.key]) {
            stack.suggestedVersion = versions[stack.key];
          }
          if (stack.dependencies) {
            stack.dependencies.forEach(function (childStack) {
              setStackSelectedVersion(childStack, versions);
            });
          }
        }
        return fetchStackAnalysis(repo.attrs.full_name).then(function (data) {
          if (!data.languageFramework) {
            $log.warn('No language detected');
            return;
          }
          if (data.languageFramework === 'ruby_ror') {
            data.languageFramework = 'rails';
          }
          repo.stackAnalysis = data;
          var stack = $scope.data.stacks.find(hasKeypaths({
            'key': data.languageFramework.toLowerCase()
          }));
          if (stack) {
            setStackSelectedVersion(stack, data.version);
          }
          return stack;
        });
      };

    }
  };
}