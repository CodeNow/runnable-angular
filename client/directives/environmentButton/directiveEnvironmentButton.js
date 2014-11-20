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
      if (!$scope.instance.state) { $scope.instance.state = {}; }

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
            instance.state.envVars = $scope.envToObjects(instance.attrs.env);
            instance.state.envShow = false;
          }
        }
      };

      var instance = $scope.instance;

      instance.state.envVars = $scope.envToObjects(instance.attrs.env);

    }
  };
}