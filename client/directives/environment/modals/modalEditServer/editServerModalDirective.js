'use strict';

require('app')
  .directive('editServerModal', editServerModal);
/**
 * @ngInject
 */
function editServerModal(
  $filter,
  JSTagsCollection,
  keypather
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
          return this.currentModel;
        }
      };

      $scope.$watchCollection('portTagOptions.tags.tags', function (n) {
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
          hostName += opts.server;
        }
        if (opts.port) {
          hostName += opts.port;
        }

        $scope.$emit('eventPasteLinkedInstance', hostName);
      };
    }
  };
}
