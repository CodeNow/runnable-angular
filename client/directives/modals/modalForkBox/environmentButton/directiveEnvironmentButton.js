'use strict';

require('app')
  .directive('environmentButton', environmentButton);

function environmentButton(
  keypather,
  $rootScope
) {
  return {
    restrict: 'A',
    templateUrl: 'viewEnvironmentButton',
    scope: {
      item: '='
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
      keypather.set($scope, 'item.state.envShow', false);


      $scope.envPopover = {
        actions: {
          saveEnv: function (instance, event) {
            event.preventDefault();
            // Since these are overrides, we want to save the envs in both the opts, and the
            // item.attrs
            var updatedEnvs = $scope.envToStrings(keypather.get($scope, 'item.state.envVars'));

            keypather.set($scope, 'item.opts.env', updatedEnvs);
            keypather.set($scope, 'item.attrs.env', updatedEnvs);

            keypather.set($scope, 'item.state.envShow', false);
          },
          cancelEnv: function (instance, event) {
            event.preventDefault();
            keypather.set($scope, 'item.state.envVars',
              $scope.envToObjects(keypather.get($scope, 'item.opts.env')));
            keypather.set($scope, 'item.state.envShow', false);
          }
        }
      };

      $scope.$watch('item.opts.env', function (n) {
        if (!n) { return; }
        // Programatic update of env due to instance name change
        keypather.set($scope, 'item.state.envVars',
          $scope.envToObjects(keypather.get($scope, 'item.opts.env')));
      });

    }
  };
}
