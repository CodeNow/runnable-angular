'use strict';

require('app')
  .directive('setupServerModal', setupServerModal);
/**
 * @ngInject
 */
function setupServerModal(
  createNewBuild,
  $rootScope,
  errs,
  fetchOwnerRepos,
  fetchStackAnalysis,
  hasKeypaths,
  keypather,
  loading,
  loadingPromises,
  promisify,
  updateDockerfileFromState,
  fetchDockerfileFromSource,
  PortTagOptions,
  $log,
  cardInfoTypes,
  OpenItems,
  fetchStackInfo,
  $timeout
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
      loadingPromises.clear('setupServerModal');
      $scope.isLoading = $rootScope.isLoading;
      loading.reset('setupServerModal');

      var MainRepo = cardInfoTypes.MainRepository;

      var mainRepoContainerFile = new MainRepo();
      $scope.portsSet = false;
      $scope.isNewContainer = true;
      $scope.openItems = new OpenItems();
      $scope.getElasticHostname =  function () {
        if ($scope.state.repo.attrs) {
          // NOTE: Is this the best way to get the hostname?
          var repo = $scope.state.repo;
          var repoName = repo.attrs.name;
          var repoOwner = repo.attrs.owner.login.toLowerCase();
          var domain = $scope.state.repo.opts.userContentDomain;
          // NOTE: How can I know whether it will be staging or not?
          var hostname = repoName + '-stating-' + repoOwner + '.' + domain;
          return hostname;
        }
        return '';
      };
      $scope.state = {
        opts: {
          masterPod: true,
          name: ''
        },
        step: 1,
        advanced: false,
        containerFiles: [
          mainRepoContainerFile
        ],
        packages: new cardInfoTypes.Packages(),
        getPorts: function () {
          if ($scope.portTagOptions) {
            return $scope.portTagOptions.convertTagsToPortList();
          }
          return [];
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
        var instances = keypather.get($scope, 'data.instances');
        if (!instances) {
          return false;
        }
        return !!instances.find(function (instance) {
          var repoName = instance.getRepoName();
          if (repoName) {
            return repo.attrs.name === repoName;
          } else {
            return normalizeRepoName(repo) === instance.attrs.name;
          }
        });
      };

      $scope.goToNextStep = function () {
        $scope.state.step += 1;
        if ($scope.state.step === 1) {
          $scope.changeTab('repository');
        }
        else if ($scope.state.step === 2) {
          $scope.changeTab('commands');
        }
        else if ($scope.state.step === 3) {
          $scope.changeTab(null);
          loadAllOptions(); // When stack is selected, load dockerfile, etc
        }
      };

      function openDockerfile() {
        return promisify($scope.state.contextVersion, 'fetchFile')('/Dockerfile')
          .then(function (dockerfile) {
            if ($scope.state.dockerfile) {
              $scope.openItems.remove($scope.state.dockerfile);
            }
            if (dockerfile) {
              $scope.openItems.add(dockerfile);
            }
            $scope.state.dockerfile = dockerfile;
          });
      }

     function loadAllOptions() {
        loading('setupServerModal', true); // Add spinner to modal
        // Populate ports at when stack has been selected
        $scope.portTagOptions = new PortTagOptions();
        var ports = keypather.get($scope, 'state.selectedStack.ports');
        if (ports) {
          $scope.portTagOptions.setTags(ports);
        }
        return fetchDockerfileFromSource($scope.state.selectedStack.key)
          .then(function () {
            return updateDockerfileFromState($scope.state, false, true);
          })
          .then(function () {
            $scope.openItems.updateAllFiles();
            return openDockerfile();
          })
          .then(function () {
            // Return modal to normal state
            loading('setupServerModal', false);
          });
      }

      $scope.changeTab = function (tabname) {
        $scope.selectedTab = tabname;
      };

      $scope.createServer = function () {
        $scope.state.ports = $scope.state.getPorts();
        var createPromise = loadingPromises.finished('setupServerModal')
          .then(function () {
            return updateDockerfileFromState($scope.state, false, true);
          })
          .then(function () {
            if ($scope.state.acv.attrs.branch !== $scope.state.branch.attrs.name) {
              return promisify($scope.state.acv, 'update')({
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

      $scope.selectRepo = function (repo) {
        if ($scope.repoSelected) { return; }

        mainRepoContainerFile.name = repo.attrs.name;
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
            return promisify(repo, 'fetchBranch')(repo.attrs.default_branch);
          })
          .then(function (masterBranch) {
            $scope.state.branch = masterBranch;
            // Set the repo here so the page change happens after all of these fetches
            return promisify($scope.state.contextVersion.appCodeVersions, 'create', true)({
              repo: repo.attrs.full_name,
              branch: masterBranch.attrs.name,
              commit: masterBranch.attrs.commit.sha
            });
          })
          .then(function () {
            $scope.state.acv = $scope.state.contextVersion.getMainAppCodeVersion();
            $scope.state.repo = repo;
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
        return fetchStackInfo()
          .then(function (stacks) {
            return fetchStackAnalysis(repo.attrs.full_name)
              .then(function (data) {
                if (!data.languageFramework) {
                  $log.warn('No language detected');
                  return;
                }
                if (data.languageFramework === 'ruby_ror') {
                  data.languageFramework = 'rails';
                }
                repo.stackAnalysis = data;

                var stack = stacks.find(hasKeypaths({
                  'key': data.languageFramework.toLowerCase()
                }));
                if (stack) {
                  setStackSelectedVersion(stack, data.version);
                  return stack;
                }
              });
          });
      };
    }
  };
}
