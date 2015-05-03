'use strict';

require('app')
  .directive('editServerModal', editServerModal);
/**
 * @ngInject
 */
function editServerModal(
  $q,
  errs,
  JSTagsCollection,
  hasKeypaths,
  getInstanceClasses,
  eventTracking,
  fetchDockerfileFromSource,
  findLinkedServerVariables,
  keypather,
  OpenItems,
  pFetchUser,
  populateDockerfile,
  promisify,
  $rootScope
) {
  return {
    restrict: 'A',
    templateUrl: 'editServerModalView',
    scope: {
      actions: '=',
      data: '=',
      defaultActions: '=',
      server: '= currentModel',
      selectedTab: '= stateModel'
    },
    link: function ($scope, elem, attrs) {
      $scope.portTagOptions = {
        breakCodes: [
          13, // return
          32, // space
          44, // comma (opera)
          188 // comma (mozilla)
        ],
        texts: {
          'inputPlaceHolder': 'Add ports here',
          maxInputLength: 5,
          onlyDigits: true
        },
        tags: new JSTagsCollection(($scope.server.ports || '').split(' '))
      };

      $scope.linkedEnvResults = findLinkedServerVariables($scope.server.opts.env);
      $scope.$watchCollection('state.opts.env', function (n) {
        if (n) {
          $scope.linkedEnvResults = findLinkedServerVariables(n);
        }
      });

      $scope.openItems = new OpenItems();

      function convertTagToPortList() {
        return Object.keys($scope.portTagOptions.tags.tags).map(function (key) {
          return $scope.portTagOptions.tags.tags[key].value;
        });
      }
      $scope.validation = {
        env: null
      };

      // For the build and server logs
      $scope.instance = $scope.server.instance;
      $scope.build = $scope.server.build;

      function resetState(server) {
        $scope.state = {
          advanced: server.advanced || false,
          startCommand: server.startCommand,
          selectedStack: server.selectedStack,
          opts: {
            // Don't save envs here, since EnvVars will add them.
          },
          repo: server.repo,
          server: server
        };

        if (server.repo) {
          $scope.branches = server.repo.branches;
          $scope.state.branch =
            server.repo.branches.models.find(hasKeypaths({'attrs.name': keypather.get(
              server,
              'instance.contextVersion.appCodeVersions.models[0].attrs.branch'
            )}));
        }
        return promisify(server.contextVersion, 'deepCopy')()
          .then(function (contextVersion) {
            $scope.state.contextVersion = contextVersion;
            return promisify(contextVersion, 'fetch')();
          })
          .then(function (contextVersion) {
            if (contextVersion.attrs.advanced) {
              openDockerfile();
            }
            if (contextVersion.appCodeVersions.models.length) {
              $scope.acv = contextVersion.appCodeVersions.models[0];
            }
            return pFetchUser();
          })
          .then(function (user) {
            return promisify(user, 'createBuild')({
              contextVersions: [$scope.state.contextVersion.id()],
              owner: {
                github: user.oauthId()
              }
            });
          })
          .then(function (build) {
            $scope.state.build = build;
          })
          .catch(function (err) {
            errs.handler(err);
          });
      }

      resetState($scope.server);

      $scope.changeTab = function (tabname) {
        if ($scope.editServerForm.$invalid ||
            (!$scope.state.advanced && $scope.state.isStackInfoEmpty($scope.state.selectedStack))) {
          return;
        }
        $scope.selectedTab = tabname;
      };


      $scope.insertHostName = function (opts) {
        var hostName = '';
        if (opts.protocol) {
          hostName += opts.protocol;
        }
        if (opts.server) {
          hostName += opts.server.getElasticHostname();
        }
        if (opts.port) {
          hostName += ':' + opts.port;
        }
        $rootScope.$broadcast('eventPasteLinkedInstance', hostName);
      };

      $scope.getUpdatePromise = function () {
        $scope.building = true;
        $scope.state.ports = convertTagToPortList();
        var unwatch = $scope.$watch('openItems.isClean', function (n) {
          if (!n) {
            return;
          }
          unwatch();
          return $q.when($scope.state)
            .then(function (state) {
              if (state.advanced) {
                return buildBuild(state);
              } else if (state.server.startCommand !== state.startCommand ||
                  state.server.ports !== state.ports ||
                  !angular.equals(state.server.selectedStack, state.selectedStack)) {
                return updateDockerfile(state);
              }
              return state;
            })
            .then(function (state) {
              return promisify($scope.instance, 'update')(state.opts);
            })
            .then(function () {
              $scope.defaultActions.close();
              if (keypather.get($scope.instance, 'container.running()')) {
                return promisify($scope.instance, 'redeploy')();
              }
            })
            .catch(function (err) {
              $scope.building = false;
              errs.handler(err);
            });
        });
      };

      function buildBuild(state) {
        eventTracking.triggeredBuild(false);
        return promisify(state.build, 'build')({ message: 'manual' })
          .then(function (build) {
            state.opts.build = build.id();
            return state;
          });
      }

      function updateDockerfile(state) {
        return promisify(state.contextVersion, 'fetchFile')('/Dockerfile')
          .then(function (newDockerfile) {
            state.dockerfile = newDockerfile;
            return fetchDockerfileFromSource(
              state.selectedStack.key,
              $scope.data.sourceContexts
            );
          })
          .then(function (sourceDockerfile) {
            return populateDockerfile(
              sourceDockerfile,
              state,
              state.dockerfile
            );
          })
          .then(function () {
            return buildBuild($scope.state);
          });
      }

      function openDockerfile() {
        var rootDir = keypather.get($scope.state, 'contextVersion.rootDir');
        if (!rootDir) {
          return $q.reject(new Error('rootDir not found'));
        }
        return promisify(rootDir.contents, 'fetch')()
          .then(function () {
            var file = rootDir.contents.models.find(function (file) {
              return (file.attrs.name === 'Dockerfile');
            });
            if (file) {
              $scope.openItems.add(file);
            }
          });
      }



      // Only start watching this after the context version has
      $scope.$watch('state.advanced', function (advanced, previousAdvanced) {
        // This is so we don't fire the first time with no changes
        if (advanced !== previousAdvanced) {
          waitForStateContextVersion($scope, function () {
            $rootScope.$broadcast('close-popovers');
            $scope.selectedTab = advanced ? 'buildfiles' : 'stack';
            if (advanced) {
              openDockerfile();
            }
            return promisify($scope.state.contextVersion, 'update')({
              advanced: advanced
            })
              .catch(function (err) {
                errs.handler(err);
                $scope.state.advanced = $scope.server.advanced;
              });
          });
        }
      });

      $scope.$watch('state.branch', function (newBranch, oldBranch) {
        if (newBranch && oldBranch && newBranch.attrs.name !== oldBranch.attrs.name) {
          waitForStateContextVersion($scope, function () {
            promisify($scope.acv, 'update')({
              repo: $scope.server.repo.attrs.full_name,
              branch: newBranch.attrs.name,
              commit: newBranch.attrs.commit.sha
            })
              .catch(errs.handler);
          });
        }
      });


      $scope.state.isStackInfoEmpty = function (selectedStack) {
        if (!selectedStack || !selectedStack.selectedVersion) {
          return true;
        }
        if (selectedStack.dependencies) {
          var depsEmpty = !selectedStack.dependencies.find(function (dep) {
            return !$scope.state.isStackInfoEmpty(dep);
          });
          return !!depsEmpty;
        }
      };
    }
  };
}

function waitForStateContextVersion($scope, cb) {
  var unWatch = $scope.$watch('state.contextVersion', function (n) {
    if (n) {
      unWatch();
      cb();
    }
  });
}
