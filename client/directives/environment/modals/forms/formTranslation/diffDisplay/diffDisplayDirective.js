'use strict';

require('app')
  .directive('diffDisplay', function fileEditor(
    createTransformRule,
    keypather
  ) {
    return {
      restrict: 'A',
      templateUrl: 'diffDisplayView',
      scope: {
        actions: '=?',
        fileDiff: '=',
        previewAll: '=?',
        state: '='
      },
      link: function ($scope, element, attrs) {
        $scope.ignore = {
          toggleIgnoreFile: function (fileDiff) {
            var acv = keypather.get($scope, 'state.contextVersion.appCodeVersions.models[0]');
            if (acv) {
              var newArray = acv.attrs.transformRules.exclude.concat(fileDiff.from);
              createTransformRule(acv, newArray)
                .then($scope.actions.recalculateRules);
            }
          },
          checkFileIgnored: function (fileDiff) {
            var acv = keypather.get($scope, 'state.contextVersion.appCodeVersions.models[0]');
            if (acv) {
              return acv.attrs.transformRules.exclude.indexOf(fileDiff.from) >= 0;
            }
          }
        };
      }
    };
  });
