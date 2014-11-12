require('app')
  .directive('envValidation', envValidation);
/**
 * @ngInject
 */
function envValidation(
  async,
  keypather,
  QueryAssist,
  $rootScope,
  $stateParams,
  validateEnvVars,
  user
) {
  return {
    restrict: 'E',
    replace: true,
    scope: {},
    templateUrl: 'viewEnvValidation',
    link: function($scope, elem, attrs) {

      function fetchUser(cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {
            if (err) throw err;
            cb();
          })
          .go();
      }

      function fetchInstance(cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchInstances')
          .query({
            githubUsername: $stateParams.userName,
            name: $stateParams.instanceName
          })
          .cacheFetch(function (instances, cached, cb) {
            if (!cached && !instances.models.length) {
              return cb(new Error('Instance not found'));
            }
            var instance = instances.models[0];
            $scope.instance = instance;
            $scope.build = instance.build;
            $rootScope.safeApply();
          })
          .resolve(function (err, instances, cb) {
            var instance = instances.models[0];
            if (!keypather.get(instance, 'containers.models') || !instance.containers.models.length) {
              return cb(new Error('instance has no containers'));
            }
            $rootScope.safeApply();
            cb(err);
          })
          .go();
      }

      async.series([
        fetchUser,
        fetchInstance
      ], function (err) {
        $rootScope.safeApply();
        if (err) throw err;
      });

      // property controlled by directiveEnvVars
      $scope.$watch('instance.state.env', function (newEnvVal, oldEnvVal) {
        $scope.envValidation = validateEnvVars(newEnvVal);
      });

    }
  };
}
