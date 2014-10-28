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
      item: '='
    },
    templateUrl: 'viewEnvVars',
    link: function ($scope, elem, attrs) {

      function fetchUser (cb) {
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

      /**
       * use buildId if stateParams.buildId (instance.setup)
       * otherwise fetch instance & build (instance.instance && instance.edit)
       */
      function fetchBuild (cb) {
        if (!$stateParams.buildId) {
          return fetchInstance(cb);
        }
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchBuild')
          .query($stateParams.buildId)
          .cacheFetch(function (build, cached, cb) {
            $scope.build = build;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, build, cb) {
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
            $scope.build    = instance.build;
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
        fetchBuild
      ], function (err) {
        $rootScope.safeApply();
        if (err) throw err;
      });







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

    }
  };
}

