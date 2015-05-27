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
              var newArray;
              if ($scope.actions.checkFileIgnored(fileDiff)) {
                newArray = acv.attrs.transformRules.exclude;
                newArray.splice(newArray.indexOf(fileDiff.from), 1);
              } else {
                newArray = acv.attrs.transformRules.exclude.concat(fileDiff.from);
              }
              createTransformRule(acv, newArray)
                .finally(function () {
                  fileDiff.ignoring = false;
                });
            }
          }
        };
      }
    };
  });
