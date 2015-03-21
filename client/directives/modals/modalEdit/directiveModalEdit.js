'use strict';

require('app')
  .directive('modalEdit', modalEdit);
/**
 * directive modalEdit
 * @ngInject
 */
function modalEdit(
  $localStorage,
  configUserContentDomain,
  errs,
  keypather,
  OpenItems,
  promisify
) {
  return {
    restrict: 'A',
    templateUrl: 'viewModalEdit',
    scope: {
      data: '=',
      actions: '=',
      defaultActions: '='
    },
    link: function ($scope, element, attrs) {
      $scope.openItems = new OpenItems();
      // Add thing
      $scope.validation = {};
      $scope.tempModel = {};
      $scope.configUserContentDomain = configUserContentDomain;

      $scope.getAllErrorsCount = function () {
        var envErrors = keypather.get($scope, 'data.instance.validation.envs.errors.length') || 0;
        var dockerFileErrors = keypather.get($scope, 'dockerfile.validation.errors.length') || 0;
        return envErrors + dockerFileErrors;
      };

      if ($scope.data.instance) {
        $scope.data.instance.validation = {
          envs: {}
        };
      }
      $scope.popoverExposeInstruction = {
        data: {
          show: false
        },
        actions: {}
      };
      $scope.popoverLinkServers = {
        data: {
          show: false
        },
        actions: {}
      };

      function setDefaultTabs() {
        var rootDir = keypather.get($scope, 'build.contextVersions.models[0].rootDir');
        if (!rootDir) { throw new Error('rootDir not found'); }
        return promisify(rootDir.contents, 'fetch')()
          .then(function () {
            var file = rootDir.contents.models.find(function (file) {
              return (file.attrs.name === 'Dockerfile');
            });
            if (file) {
              $scope.dockerfile = file;
              $scope.openItems.add(file);
            }
          });
      }

      $scope.pasteLinkedInstance = function (text) {
        $scope.$broadcast('eventPasteLinkedInstance', text);
      };

      function resetBuild() {
        return promisify($scope.data.instance.build, 'deepCopy')()
          .then(function (build) {
            $scope.build = build;
            return promisify(build.contextVersions.models[0], 'fetch')();
          });
      }
      resetBuild()
        .then(setDefaultTabs)
        .catch(errs.handler);
    }
  };
}