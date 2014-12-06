require('app')
  .directive('environmentButton', environmentButton);

function environmentButton (
  $rootScope
) {
  return {
    restrict: 'E',
    templateUrl: 'viewEnvironmentButton',
    replace: true,
    scope: {
      instance: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.envToObjects = function (envArr) {
        if (!envArr) { return []; }
        return envArr.reduce(function (arr, env) {
          // Only split on the first equals
          env = env.split(/=(.+)/, 2);
          arr.push({key: env[0], value: env[1]});
          return arr;
        }, []);
      };

      $scope.envToStrings = function (envArr) {
        if (!envArr) { return []; }
        return envArr.reduce(function (arr, obj) {
          arr.push(obj.key + '=' + obj.value);
          return arr;
        }, []);
      };

      var originalState = {};
      $scope.envPopover = {
        actions: {
          saveEnv: function (instance, event) {
            event.preventDefault();
            instance.extend({
              env: $scope.envToStrings(instance.state.envVars)
            });
            instance.state.envShow = false;
          },
          cancelEnv: function (instance, event) {
            event.preventDefault();
            instance.state.envVars = $scope.envToObjects(originalState.env || instance.attrs.env);
            instance.state.envShow = false;
          }
        }
      };

      var instance;
      instance = $scope.instance;
      if (!$scope.instance.state) {
        $scope.instance.state = {};
      } else {
        originalState = $scope.instance.state;
      }

      instance.state.envVars = $scope.envToObjects(instance.attrs.env);

      $scope.$watch('instance.state.env', function (n) {
        if (!n) { return; }

        // Programatic update of env due to instance name change
        instance.state.envVars = $scope.envToObjects(instance.state.env);
        $rootScope.safeApply();
      });

    }
  };
}