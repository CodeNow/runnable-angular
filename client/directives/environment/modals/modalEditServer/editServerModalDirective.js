'use strict';

require('app')
  .directive('editServerModal', editServerModal);
/**
 * @ngInject
 */
function editServerModal(
  errs,
  JSTagsCollection,
  hasKeypaths,
  keypather,
  OpenItems,
  pFetchUser,
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
        tags: new JSTagsCollection($scope.server.ports || [])
      };

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
        server: $scope.server,
        getChanges: function () {
          var changes = {
            server: $scope.server
          };
          if (this.server.startCommand !== this.startCommand) {
            keypather.set(changes, 'dockerfile.startCommand', this.startCommand);
          }
          if (this.server.ports !== this.ports) {
            keypather.set(changes, 'dockerfile.ports', this.ports);
          }
          // use angular.equals since we've made copies
          if (!angular.equals(this.server.selectedStack, this.selectedStack)) {
            keypather.set(changes, 'dockerfile.selectedStack', this.selectedStack);
          }
          if (!angular.equals(this.server.opts.env, this.opts.env)) {
            keypather.set(changes, 'opts.env', this.opts.env);
          }
          return changes;
        },
        updateCurrentModel: function () {
          this.server.ports = convertTagToPortList();
          this.server.selectedStack = this.selectedStack;
          keypather.set(this.server, 'opts.env', this.opts.env);
          this.server.startCommand = this.startCommand;
          this.server.build = this.build;
          this.server.contextVersion = this.contextVersion;
          return this.server;
        }
      };
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


      $scope.$watchCollection('portTagOptions.tags.tags', function () {
        $scope.state.ports = convertTagToPortList();
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
