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
            if (fileDiff.ignoring) { return; }
            var acv = keypather.get($scope, 'state.contextVersion.getMainAppCodeVersion()');
            fileDiff.ignoring = true;
            if (acv) {
              var newArray = acv.attrs.transformRules.exclude.concat(fileDiff.from);
              createTransformRule(acv, newArray)
                .then($scope.actions.recalculateRules)
                .finally(function () {
                  fileDiff.ignoring = false;
                });
            }
          },
          checkFileIgnored: function (fileDiff) {
            var acv = keypather.get($scope, 'state.contextVersion.getMainAppCodeVersion()');
            if (acv) {
              return acv.attrs.transformRules.exclude.indexOf(fileDiff.from) >= 0;
            }
          }
        };
      }
    };
  });
