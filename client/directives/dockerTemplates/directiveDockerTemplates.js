'use strict';

require('app')
  .directive('dockerTemplates', dockerTemplates);
/**
 * @ngInject
 */
function dockerTemplates(
  promisify,
  $stateParams,
  fetchContexts,
  fetchBuild,
  errs
) {
  return {
    restrict: 'A',
    templateUrl: 'viewDockerTemplates',
    scope: {
      openItems: '=',
      valid: '='
    },
    link: function ($scope, elem, attrs) {

      /**
       * Fetch dockerfile(s) for seed context
       */
      $scope.selectedSourceContext = null;
      $scope.valid = false;
      $scope.selectSourceContext = function (context) {
        $scope.valid = false;
        $scope.openItems.reset([]);
        $scope.selectedSourceContext = context;

        var contextVersion, sourceContextVersion;

        return promisify($scope.selectedSourceContext, 'fetchVersions')()
        .then(function(versions) {
          $scope.versions = versions;

          contextVersion = $scope.build.contextVersions.models[0];
          sourceContextVersion = $scope.versions.models[0];
          var sourceInfraCodeVersion = $scope.versions.models[0].attrs.infraCodeVersion;
          return promisify(contextVersion, 'copyFilesFromSource')(
            sourceInfraCodeVersion
          );
        }).then(function() {
          contextVersion.source = sourceContextVersion.id();
          return promisify(contextVersion, 'fetchFsList')({
            path: '/'
          });
        }).then(function(files) {
          $scope.openItems.add(files.models);
          $scope.valid = true;
        }).catch(errs.handler);
      };

      $scope.getTemplateValueFunction = function(template) {
        return (template.attrs.name === 'Blank') ? 0 : template.attrs.name;
      };

      fetchBuild($stateParams.buildId)
      .then(function(build) {
        $scope.build = build;
        return fetchContexts({
          isSource: true
        });
      }).then(function(contexts) {
        $scope.seedContexts = contexts;
      }).catch(errs.handler);

    }
  };
}
