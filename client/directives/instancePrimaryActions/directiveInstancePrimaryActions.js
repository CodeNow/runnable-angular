require('app')
  .directive('instancePrimaryActions', instancePrimaryActions);
/**
 * @ngInject
 */
function instancePrimaryActions(
  async,
  keypather,
  QueryAssist,
  $rootScope,
  $stateParams,
  $timeout,
  user
) {
  return {
    restrict: 'E',
    templateUrl: 'viewInstancePrimaryActions',
    replace: true,
    scope: {
      saving: '=',
      openItems: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.popoverSaveOptions = {
        data: {},
        actions: {}
      };
      $scope.popoverSaveOptions.data.show = false;
      $scope.popoverSaveOptions.data.restartOnSave = false;

      $scope.saving = false;
      $scope.loading = false;

      $scope.$watch('instance', function (n) {
        if (n) $scope.popoverSaveOptions.data.instance = n;
      });

      $scope.saveChanges = function () {
        // weird hackiness to get the saving spinner to display
        $scope.saving = false;
        $timeout(function () {
          $scope.saving = true;
          $rootScope.safeApply();
        }, 1);
        var updateModels = $scope.openItems.models
          .filter(function (model) {
            if (typeof keypather.get(model, 'attrs.body') !== 'string') {
              return false;
            }
            return (model.attrs.body !== model.state.body);
          });
        async.each(
          updateModels,
          function iterate(file, cb) {
            file.update({
              json: {
                body: file.state.body
              }
            }, function (err) {
              if (err) {
                throw err;
              }
              $rootScope.safeApply();
              cb();
            });
          },
          function complete(err) {
            if ($scope.popoverSaveOptions.data.restartOnSave) {
              $scope.instance.restart(function(err) {
                if (err) throw err;
                $rootScope.safeApply();
                $scope.instance.fetch(function(err) {
                  if (err) throw err;
                  $rootScope.safeApply();
                });
              });
              // need container !running here
              keypather.set($scope.instance, 'containers.models[0].attrs.inspect.State.Running', false);
            }
            $rootScope.safeApply();
          }
        );
      };

      function fetchUser(cb) {
        new QueryAssist(user, cb)
          .wrapFunc('fetchUser')
          .query('me')
          .cacheFetch(function (user, cached, cb) {
            $scope.user = user;
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, user, cb) {})
          .go();
      }

      function fetchInstance(cb) {
        new QueryAssist($scope.user, cb)
          .wrapFunc('fetchInstances', cb)
          .query({
            githubUsername: $stateParams.userName,
            name: $stateParams.instanceName
          })
          .cacheFetch(function (instances, cached, cb) {
            if (!cached && instances.models.length === 0) {
              throw new Error('instance not found');
            }
            $scope.instance = instances.models[0];
            $rootScope.safeApply();
            cb();
          })
          .resolve(function (err, projects, cb) {
            if (err) throw err;
          })
          .go();
      }

      async.series([
        fetchUser,
        fetchInstance
      ]);

    }
  };
}
