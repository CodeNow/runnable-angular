'use strict';

require('app')
  .directive('ignoredTranslation', function ignoredTranslation(
    createTransformRule,
    debounce,
    keypather,
    promisify
  ) {
    return {
      restrict: 'A',
      templateUrl: 'ignoredTranslationView',
      scope: {
        state: '='
      },
      link: function ($scope, element, attrs) {
        $scope.ignoredFilesList = '';
        var editor;
        $scope.aceLoaded = function (_editor) {
          // Editor part
          editor = _editor;
          var _renderer = _editor.renderer;
          if (_renderer.lineHeight === 0) {
            _renderer.lineHeight = 19;
          }
          editor.focus();
        };

        $scope.aceBlurred = function () {
          var acv = keypather.get($scope, 'state.contextVersion.appCodeVersions.models[0]');
          if (acv) {
            var newArray = $scope.ignoredFilesList.split('\n').filter(function (v) {
              return v.length;
            });
            if (!angular.equals(acv.attrs.transformRules.exclude, newArray)) {
              createTransformRule(acv, newArray);
            }
          }
        };


        $scope.$watch('state.contextVersion.appCodeVersions.models[0]', function (n) {
          if (n) {
            $scope.ignoredFilesList = n.attrs.translationRules.exclude.reduce(function (stringList, rule) {
              return stringList + rule + '\n';
            }, '');
          }
        });

        $scope.$on('$destroy', function () {
          editor.session.$stopWorker();
          editor.destroy();
        });
      }
    };
  });
