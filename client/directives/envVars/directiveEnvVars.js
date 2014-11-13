require('app')
  .directive('envVars', envVars);
/**
 * @ngInject
 */
function envVars(
  async,
  keypather,
  QueryAssist,
  $rootScope,
  $stateParams,
  user
) {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      item: '=',
      currentModel: '=',
      stateModel: '='
    },
    templateUrl: 'viewEnvVars',
    link: function ($scope, elem, attrs) {

      $scope.environmentalVars = '';

      var unreg = $scope.$watch('currentModel.env', function (env) {
        if (!Array.isArray(env)) {
          return;
        }
        // houston, this is tranquility base.
        // we have asynchronously fetched the instance
        // wtf am I doing?
        $scope.environmentalVars = env.reduce(function (environmentalVars, env) {
          return environmentalVars + env + '\n';
        }, '');

        $scope.validity = {
          valid: true,
          errors: []
        };
      });

      $scope.$watch('environmentalVars', function (newEnv, oldEnv) {
        unreg();
        if (!newEnv) return;
        keypather.set($scope, 'stateModel.env', newEnv.split('\n').filter(function (v) {
          return v.length;
        }));
      });

    }
  };
}
