'use strict';

require('app')
  .directive('editServerModal', editServerModal);
/**
 * @ngInject
 */
function editServerModal(
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

      $scope.state = {
        startCommand: $scope.currentModel.startCommand,
        ports: $scope.currentModel.ports,
        selectedStack: angular.copy($scope.currentModel.selectedStack),
        opts: {
          // Don't save envs here, since EnvVars will add them.
        },
        repo: $scope.currentModel.repo,
        currentModel: $scope.currentModel,
        getChanges: function () {
          var changes = {};
          if (this.currentModel.startCommand !== this.startCommand) {
            keypather.set(changes, 'dockerfile.startCommand', this.startCommand);
          }
          if (this.currentModel.ports !== this.ports) {
            keypather.set(changes, 'dockerfile.ports', this.ports);
          }
          if (!angular.equals(this.currentModel.selectedStack, this.selectedStack)) {
            keypather.set(changes, 'dockerfile.selectedStack', this.selectedStack);
          }
          if (!angular.equals(this.currentModel.opts.env, this.opts.env)) {
            keypather.set(changes, 'opts.env', this.opts.env);
          }
          return changes;
        }
      };

      $scope.changeTab = function (tabname) {
        if (!$scope.editServerForm.$invalid) {
          $scope.stateModel = tabname;
        }
      };
    }
  };
}
