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
        var editor, session;
        $scope.aceLoaded = function (_editor) {
          // Editor part
          editor = _editor;
          session = _editor.session;
          var _renderer = _editor.renderer;
          if (_renderer.lineHeight === 0) {
            _renderer.lineHeight = 19;
          }
          editor.focus();
        };

        function update(newValues, oldValues) {
          // If the envs haven't changed, (also takes care of first null/null occurrence
          if (typeof newValues !== 'string') { return; }

          var newArray = newValues.split('\n').filter(function (v) {
            return v.length;
          });

          var oldArray = (typeof newValues !== 'string') ?
              [] : oldValues.split('\n').filter(function (v) {
            return v.length;
          });

          // Save them to the state model
          if (!angular.equals(newArray, oldArray)) {
            promisify($scope.state.contextVersion.appCodeVersions.models[0], 'update')();
          }
        }

        $scope.$watch('ignoredFilesList', debounce(update, 500));

        $scope.$watch('state.contextVersion.appCodeVersions.models[0]', function (n) {
          if (n) {
            $scope.ignoredFilesList = n.attrs.translationRules.exclude.reduce(function (stringList, rule) {
              return stringList + rule + '\n';
            }, '');
          }
        });

        $scope.$on('$destroy', function () {
          var acv = keypather.get($scope, 'state.contextVersion.appCodeVersions.models[0]');
          if (acv) {
            var newArray = $scope.ignoredFilesList.split('\n').filter(function (v) {
              return v.length;
            });
            if (newArray.length && !angular.equals(acv.attrs.transformRules.exclude, newArray)) {
              createTransformRule(acv, newArray);
            }
          }
          editor.session.$stopWorker();
          editor.destroy();
        });
      }
    };
  });
