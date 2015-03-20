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

      $scope.popoverExposeInstruction = {
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
              $scope.openItems.add(file);
            }
          });
      }

      $scope.pasteLinkedInstance = function (text) {
        $scope.$broadcast('eventPasteLinkedInstance', text);
      };
      $scope.data.hideGuideHelpEnvModal =
          keypather.get($localStorage, 'guides.hideGuideHelpEnvModal') || false;

      $scope.onChangeHideGuideEnv = function () {
        $scope.data.hideGuideHelpEnvModal = true;
        keypather.set($localStorage, 'guides.hideGuideHelpEnvModal', true);
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
