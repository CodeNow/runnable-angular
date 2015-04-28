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
        tags: new JSTagsCollection($scope.server.ports.split(' ') || [])
      };
      $scope.getInstanceClasses = getInstanceClasses;

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

      $scope.state = {
        advanced: $scope.server.advanced || false,
        startCommand: $scope.server.startCommand,
        selectedStack: $scope.server.selectedStack,
        opts: {
          // Don't save envs here, since EnvVars will add them.
        },
        repo: $scope.server.repo,
        server: $scope.server
      };

      $scope.getUpdatePromise = function () {
        function updatePromise() {
          var deferer = $q.defer();
          $scope.building = true;
          $scope.state.ports = convertTagToPortList();
          deferer.resolve($scope.state);
          return deferer.promise;
        }

        return updatePromise()
          .then(function (state) {
            if (state.server.startCommand !== state.startCommand ||
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
            return $scope.defaultActions.close();
          })
          .then(function () {
            if (keypather.get($scope.instance, 'container.running()')) {
              return promisify($scope.instance, 'redeploy')();
            }
          })
          .catch(function (err) {
            $scope.building = false;
            errs.handler(err);
          });
      };

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
            eventTracking.triggeredBuild(false);
            return promisify(state.build, 'build')(
              {
                message: 'manual'
              }
            );
          })
          .then(function (build) {
            $scope.instance.serverModel = $scope.state;
            $scope.state.opts.build = build.id();
            return $scope.state;
          });
      }
      if ($scope.server.repo) {
        $scope.branches = $scope.server.repo.branches;
        $scope.state.branch =
          $scope.server.repo.branches.models.find(hasKeypaths({'attrs.name': keypather.get(
            $scope.server,
            'instance.contextVersion.appCodeVersions.models[0].attrs.branch'
          )}));
      }

      promisify($scope.server.contextVersion, 'deepCopy')()
        .then(function (contextVersion) {
          $scope.state.contextVersion = contextVersion;
          return promisify(contextVersion, 'fetch')();
        })
        .then(function (contextVersion) {
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
        });

      $scope.$watch('state.branch', function (newBranch, oldBranch) {
        if (newBranch && oldBranch && newBranch.attrs.name !== oldBranch.attrs.name) {
          promisify($scope.acv, 'update')({
            repo: $scope.server.repo.attrs.full_name,
            branch: newBranch.attrs.name,
            commit: newBranch.attrs.commit.sha
          })
            .catch(errs.handler);
        }
      });

      $scope.$watch('state.advanced', function (advanced, previousAdvanced) {
        if (advanced !== previousAdvanced) {
          $rootScope.$broadcast('close-popovers');
          $scope.selectedTab = advanced ? 'buildfiles' : 'stack';
          return promisify($scope.state.contextVersion, 'update')({
            advanced: advanced
          })
            .catch(function (err) {
              errs.handler(err);
              $scope.state.advanced = !advanced;
            });
        }
      });

      $scope.changeTab = function (tabname) {
        if (!$scope.editServerForm.$invalid) {
          $scope.selectedTab = tabname;
        }
      };

      $scope.insertHostName = function (opts) {
        var hostName = '';
        if (opts.protocol) {
          hostName += opts.protocol;
        }
        if (opts.server) {
          hostName += opts.server.getMasterHost();
        }
        if (opts.port) {
          hostName += ':' + opts.port;
        }
        $rootScope.$broadcast('eventPasteLinkedInstance', hostName);
      };
    }
  };
}
