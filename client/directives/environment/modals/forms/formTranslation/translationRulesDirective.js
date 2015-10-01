'use strict';

require('app')
  .directive('translationRules', function translationRules(
    errs,
    keypather,
    parseDiffResponse,
    promisify,
    testAllTransformRules,
    $document
  ) {
    return {
      restrict: 'A',
      templateUrl: 'viewFormTranslation',
      scope: {
        actions: '= actions',
        state: '=',
        instance: '= instance',
        data: '=? data'
      },
      link: function ($scope, elem, attrs) {
        $scope.$watch('state.contextVersion', function (contextVersion) {
          if (contextVersion &&
              (keypather.get(contextVersion, 'getMainAppCodeVersion().attrs.transformRules.replace.length') ||
              keypather.get(contextVersion, 'getMainAppCodeVersion().attrs.transformRules.rename.length'))) {
            $scope.actions.recalculateRules();
          }
        });
        $scope.actions = {
          jumpTo: function (diff) {
            var fileLink = angular.element($document[0].getElementById('diff-' + diff.$$hashKey));
            angular.element($document[0].querySelector('form[name="editServerForm"] .modal-body')).scrollToElement(fileLink, 10, 200);
          },
          recalculateRules: function () {
            // Don't use loadingPromises here, since the initial tab load will run this, and we
            // don't need the save button to wait for that
            $scope.state.recalculating = true;
            return $scope.actions.recalculateSilently()
              .then(function (body) {
                $scope.state.diffs = parseDiffResponse(body.diff);
                $scope.state.transformResults = body.results;
                return promisify($scope.state.contextVersion, 'fetch')();
              })
              .catch(errs.handler)
              .finally(function () {
                $scope.state.recalculating = false;
              });
          },
          recalculateSilently: function () {
            var acv = keypather.get($scope, 'state.contextVersion.getMainAppCodeVersion()');
            return testAllTransformRules(acv);
          },
          ignoreFile: function (fileDiff) {
            $scope.$broadcast('IGNOREDFILE::toggle', fileDiff);
          }

        };
      }
    };
  });
