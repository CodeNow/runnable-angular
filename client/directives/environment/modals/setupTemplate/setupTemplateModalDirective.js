'use strict';

require('app')
  .directive('setupTemplateModal', setupTemplateModal);
/**
 * @ngInject
 */
function setupTemplateModal(
  $rootScope,
  copySourceInstance,
  getNewForkName,
  keypather,
  fetchUser,
  promisify
) {
  return {
    restrict: 'A',
    templateUrl: 'setupTemplateModalView',
    scope: {
      actions: '=',
      data: '=',
      defaultActions: '='
    },
    link: function ($scope) {
      $scope.$watch('data.allDependencies', function (n) {
        if (n) {
          n.models.forEach(function (templateInstance) {
            if (!templateInstance.description) {
              return promisify(templateInstance.build.contexts.models[0], 'fetch')()
                .then(function (context) {
                  templateInstance.description =
                      keypather.get(context, 'attrs.description');
                });
            }
          });
        }
      });

      $scope.addServerFromTemplate = function(sourceInstance) {
        var serverName = getNewForkName(sourceInstance, $scope.data.instances, true);

        var serverModel = {
          opts: {
            name: serverName,
            masterPod: true
          }
        };
        return $scope.actions.createAndBuild(
          copySourceInstance(
            $rootScope.dataApp.data.activeAccount,
            sourceInstance,
            serverName
          )
            .then(function (build) {
              serverModel.build = build;
              return serverModel;
            }),
          serverName
        );
      };
    }
  };
}
