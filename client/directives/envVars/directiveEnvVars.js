require('app')
  .directive('envVars', envVars);
/**
 * @ngInject
 */
function envVars(
  keypather
) {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      in: '=',
      currentModel: '=',
      stateModel: '='
    },
    templateUrl: 'viewEnvVars',
    link: function ($scope, elem, attrs) {

      $scope.environmentalVars = '';
      var editor, session;

      function getEnvLength() {
        return keypather.get($scope, 'stateModel.env.length') || keypather.get($scope, 'currentModel.env.length');
      }

      if ($scope.stateModel) {
        // Add the validity checker
        $scope.stateModel.envValidation = {
          valid: true,
          errors: []
        };
      }
      $scope.aceLoaded = function(_editor){
        // Editor part
        editor = _editor;
        session = _editor.session;
        $scope.$watchCollection('stateModel.envValidation.errors', function (n, p) {
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

        // Super hacky hack to basically make the gutter not flip out as much as on init
        var _renderer = _editor.renderer;
        if (_renderer.$gutterLayer.gutterWidth === 0) {
          var envLength = getEnvLength();
          _renderer.$gutterLayer.gutterWidth =
            ((envLength > 100) ? 60 : (envLength > 10) ? 51 : 42) + 4;
        }
        if (_renderer.lineHeight === 0) {
          _renderer.lineHeight = 19;
        }
        // Options
      };

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

      // When the envs on the screen change
      var unwatchScreenEnvs = $scope.$watch('environmentalVars', function (newEnv, oldEnv) {
        // Since the user has inputed text, we don't need to listen to the current model anymore
        unwatchCurrentModel();
        // If the envs haven't changed, (also takes care of first null/null occurrence)
        if (newEnv === oldEnv) { return; }
        // Save them to the state model
        keypather.set($scope, 'stateModel.env', newEnv.split('\n').filter(function (v) {
          return v.length;
        }));
      });

      var unwatchIn = $scope.$watch('in', function (n, p) {
        if (n === false && n !== p) {
          unwatchIn();
          unwatchCurrentModel();
          unwatchScreenEnvs();
          editor.session.$stopWorker();
          editor.destroy();
          if ($scope.stateModel) {
            $scope.stateModel.envValidation.errors = [];
            delete $scope.stateModel.envValidation;
          }
        }
      });
    }
  };
}
