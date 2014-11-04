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
      item: '='
    },
    templateUrl: 'viewEnvVars',
    link: function ($scope, elem, attrs) {

      $scope.environmentalVars = '';

      $scope.$watch('instance.attrs.env', function (env) {
        if (!Array.isArray(env)) {
          return;
        }
        // houston, this is tranquility base.
        // we have asynchronously fetched the instance
        // wtf am I doing?
        $scope.environmentalVars = env.reduce(function (environmentalVars, env) {
          return environmentalVars + env + '\n';
        }, '');

        $scope.validity = {valid: true, errors: []};

        $scope.$watch('environmentalVars', function (newEnv, oldEnv) {
          if (!newEnv) {
            return;
          }
          keypather.set($scope, 'instance.state.env', newEnv.split('\n').filter(function (v) {
            return v.length;
          }));
        });
      });

      if ($scope.setupData) {
        $scope.$watch('environmentalVars', function (newEnv, oldEnv) {
          if (!newEnv) {
            return;
          }

          keypather.set($scope, 'setupData.state.env', newEnv.split('\n').filter(function (v) {
            return v.length;
          }));
        });
      }
    }
  };
}

