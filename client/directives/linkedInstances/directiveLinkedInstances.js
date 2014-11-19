require('app')
  .directive('linkedInstances', linkedInstances);

function linkedInstances (
  $rootScope,
  async,
  user
) {
  return {
    restrict: 'E',
    templateUrl: function (elem, attrs) {
      if (attrs.type === 'modal') {
        return 'viewLinkedInstancesModal';
      } else if (attrs.type === 'sidebar') {
        return 'viewLinkedInstancesSidebar';
      } else {
        throw new Error('linkedInstances requires a type of modal or sidebar');
      }
    },
    replace: true,
    scope: {
      instanceDependencies: '=',
      instances: '=' // For dupe checking
    },
    link: function ($scope, elem, attrs) {
      $scope.linkedBoxesChecked = true;

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

      $scope.$watch('instanceDependencies', function (n) {
        if (!n) { return; }
        $scope.instanceDependencies.models.forEach(function (model) {
          model.fetch(function () {
            model.state = {
              envVars: $scope.envToObjects(model.attrs.env)
            };
            $rootScope.safeApply();
          });
        });
      });

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

    }
  };
}