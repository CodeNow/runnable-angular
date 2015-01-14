'use strict';

require('app')
  .directive('envVars', envVars);
/**
 * @ngInject
 */
function envVars(
  keypather,
  validateEnvVars,
  $rootScope
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

      unwatchValidation = $scope.$watchCollection('validation.errors', function (n, p) {
        if (n !== p) {
          if (p) {
            p.forEach(function (error) {
              session.removeGutterDecoration(error, 'ace-validation-error');
            });
          }
          if (n) {
            n.forEach(function (error) {
              session.addGutterDecoration(error, 'ace-validation-error');
            });
          }
        }
      });

      // Watch the current model for envs
      var unwatchCurrentModel = $scope.$watch('currentModel.env', function (env) {
        if (!Array.isArray(env)) {
          return;
        }
        // If we have some, add them to the screen
        $scope.environmentalVars = env.reduce(function (environmentalVars, env) {
          return environmentalVars + env + '\n';
        }, '');
      });

      function updateEnvs(newEnv, oldEnv) {
        // Since the user has inputed text, we don't need to listen to the current model anymore
        unwatchCurrentModel();
        // If the envs haven't changed, (also takes care of first null/null occurrence
        if (newEnv === oldEnv) { return; }
        $scope.validation = validateEnvVars(newEnv);
        // Save them to the state model
        keypather.set($scope, 'stateModel.env', newEnv.split('\n').filter(function (v) {
          return v.length;
        }));
      }

      // When the envs on the screen change
      var unwatchScreenEnvs = $scope.$watch('environmentalVars', updateEnvs);

      $scope.$on('$destroy', function () {
        unwatchValidation();
        unwatchCurrentModel();
        unwatchScreenEnvs();
        editor.session.$stopWorker();
        editor.destroy();
      });
    }
  };
}
