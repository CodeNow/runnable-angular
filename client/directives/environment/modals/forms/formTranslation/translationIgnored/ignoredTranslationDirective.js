'use strict';

require('app')
  .directive('ignoredTranslation', function ignoredTranslation(
    createTransformRule,
    regexpQuote,
    keypather,
    loadingPromises
  ) {
    return {
      restrict: 'A',
      templateUrl: 'ignoredTranslationView',
      scope: {
        actions: '=',
        state: '='
      },
      link: function ($scope, element, attrs) {
        $scope.ignoredFilesList = '';
        function getIgnoredFileListArray() {
          return $scope.ignoredFilesList.split('\n').filter(function (v) {
            return v.length;
          });
        }
        var editor;
        $scope.aceLoaded = function (_editor) {
          // Editor part
          editor = _editor;
          var _renderer = _editor.renderer;
          if (_renderer.lineHeight === 0) {
            _renderer.lineHeight = 19;
          }
        };

        var updateIgnoreRules = function () {
          if (getIgnoredFileListArray() ===
              keypather.get($scope, 'state.contextVersion.getMainAppCodeVersion().attrs.transformRules.exclude')) {
            return;
          }
          $scope.state.processing = true;
          return loadingPromises.add('editServerModal', createTransformRule(
            keypather.get($scope, 'state.contextVersion.getMainAppCodeVersion()'),
            getIgnoredFileListArray()
          )
            .then(function () {
              $scope.state.processing = false;
              return $scope.actions.recalculateSilently();
            }));
        };

        $scope.$on('IGNOREDFILE::toggle', function (eventName, ignoreFileDiff) {
          if (getIgnoredFileListArray().indexOf(ignoreFileDiff.from) === -1) {
            $scope.ignoredFilesList += '\n' + ignoreFileDiff.from + '\n';
            return updateIgnoreRules();
          }
        });

        $scope.aceBlurred = function () {
          if (keypather.get($scope, 'state.contextVersion.getMainAppCodeVersion()')) {
            updateIgnoreRules();
          }
        };

        $scope.$watch(
          'state.contextVersion.getMainAppCodeVersion().attrs.transformRules.exclude',
          function (n) {
            if (n) {
              $scope.ignoredFilesList = n.join('\n');
            }
          }
        );

        $scope.$on('$destroy', function () {
          editor.session.$stopWorker();
          editor.destroy();
        });
      }
    };
  });
