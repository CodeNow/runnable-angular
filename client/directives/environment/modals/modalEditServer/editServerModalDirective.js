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
      currentModel: '=',
      stateModel: '='
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
        tags: new JSTagsCollection($scope.currentModel.ports || [])
      };
      function convertTagToPortList() {
        return Object.keys($scope.portTagOptions.tags.tags).map(function (key) {
          return $scope.portTagOptions.tags.tags[key].value;
        });
      }
      $scope.instance = $scope.currentModel.instance;
      $scope.build = $scope.currentModel.build;

      $scope.state = {
        startCommand: $scope.currentModel.startCommand,
        selectedStack: angular.copy($scope.currentModel.selectedStack),
        opts: {
          // Don't save envs here, since EnvVars will add them.
        },
        repo: $scope.currentModel.repo,
        currentModel: $scope.currentModel,
        getChanges: function () {
          var changes = {
            server: $scope.currentModel
          };
          if (this.currentModel.startCommand !== this.startCommand) {
            keypather.set(changes, 'dockerfile.startCommand', this.startCommand);
          }
          if (this.currentModel.ports !== this.ports) {
            keypather.set(changes, 'dockerfile.ports', this.ports);
          }
          // use angular.equals since we've made copies
          if (!angular.equals(this.currentModel.selectedStack, this.selectedStack)) {
            keypather.set(changes, 'dockerfile.selectedStack', this.selectedStack);
          }
          if (!angular.equals(this.currentModel.opts.env, this.opts.env)) {
            keypather.set(changes, 'opts.env', this.opts.env);
          }
          return changes;
        },
        updateCurrentModel: function () {
          this.currentModel.ports = convertTagToPortList();
          this.currentModel.selectedStack = this.selectedStack;
          keypather.set(this.currentModel, 'opts.env', this.opts.env);
          this.currentModel.startCommand = this.startCommand;
          this.currentModel.build = this.build;
          this.currentModel.contextVersion = this.contextVersions;
          return this.currentModel;
        }
      };
      if ($scope.currentModel.repo) {
        $scope.branches = $scope.currentModel.repo.branches;
        $scope.state.branch =
          $scope.currentModel.repo.branches.models.find(hasKeypaths({'attrs.name': keypather.get(
            $scope.currentModel,
            'instance.contextVersion.appCodeVersions.models[0].attrs.branch'
          )}));
      }

      promisify($scope.currentModel.build, 'deepCopy')()
        .then(function (build) {
          $scope.state.build = build;
          $scope.state.contextVersion = build.contextVersions.models[0];
          return promisify($scope.state.contextVersion, 'fetch')();
        })
        .then(function (contextVersion) {
          if (contextVersion.appCodeVersions.models.length) {
            $scope.acv = contextVersion.appCodeVersions.models[0];
          }
        });

      $scope.$watch('state.branch', function (newBranch, oldBranch) {
        if (newBranch && oldBranch && newBranch.attrs.name !== oldBranch.attrs.name) {
          promisify($scope.acv, 'update')({
            repo: $scope.currentModel.repo.attrs.full_name,
            branch: newBranch.attrs.name,
            commit: newBranch.attrs.commit.sha
          })
            .catch(errs.handler);
        }
      });


      $scope.$watchCollection('portTagOptions.tags.tags', function () {
        $scope.state.ports = convertTagToPortList();
      });

      $scope.changeTab = function (tabname) {
        if (!$scope.editServerForm.$invalid) {
          $scope.stateModel = tabname;
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
