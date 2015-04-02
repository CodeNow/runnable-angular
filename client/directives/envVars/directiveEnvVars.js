'use strict';

require('app')
  .directive('envVars', envVars);
/**
 * @ngInject
 */
function envVars(
  keypather,
  validateEnvVars
) {
  return {
    replace: true,
    restrict: 'A',
    templateUrl: 'viewEnvVars',
    scope: {
      currentModel: '=',
      stateModel: '=',
      validation: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.environmentalVars = '';
      var editor, session, unwatchValidation;

      $scope.$on('eventPasteLinkedInstance', function (eventName, text) {
        editor.insert(text);
        updateEnvs(editor.getValue());
        editor.focus();
      });

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

      function updateEnvs(newEnv, oldEnv) {
        // If the envs haven't changed, (also takes care of first null/null occurrence
        if (!newEnv) { return; }

        $scope.validation = validateEnvVars(newEnv);
        if (keypather.get($scope, 'validation.errors.length')) {
          var annotations = $scope.validation.errors.map(function (error) {
            return {
              text: 'Invalid Environment Variable',
              type: 'warning',
              row: error
            };
          });
          session.setAnnotations(annotations);
        } else {
          session.clearAnnotations();
        }
        // Save them to the state model
        if (newEnv !== oldEnv) {
          keypather.set($scope, 'stateModel.env', newEnv.split('\n').filter(function (v) {
            return v.length;
          }));
        }
      }

      // When the envs on the screen change
      $scope.$watch('environmentalVars', updateEnvs);

      if (keypather.get($scope, 'stateModel.env')) {
        unwatchCurrentModel = angular.noop();
        var env = keypather.get($scope, 'stateModel.env');
        // If we have some, add them to the screen
        $scope.environmentalVars = env.reduce(function (environmentalVars, env) {
          return environmentalVars + env + '\n';
        }, '');
      } else {
        // Watch the current model for envs
        var unwatchCurrentModel = $scope.$watch('currentModel.env', function (env) {
          if (!Array.isArray(env)) {
            return;
          }
          unwatchCurrentModel();
          // If we have some, add them to the screen
          $scope.environmentalVars = env.reduce(function (environmentalVars, env) {
            return environmentalVars + env + '\n';
          }, '');
        });
      }
      $scope.$on('$destroy', function () {
        editor.session.$stopWorker();
        editor.destroy();
      });
    }
  };
}
