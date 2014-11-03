require('app')
  .directive('runnableInstancePrimaryActions', RunnableInstancePrimaryActions);
/**
 * @ngInject
 */
function RunnableInstancePrimaryActions(
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
      $scope.restartOnSave = false;

      // update local $scope property restartOnSave when popover changes
      $scope.$watch('popoverSaveOptions.data.restartOnSave', function (n) {
        $scope.restartOnSave = !!n;
      });

      $scope.$watch('instance', function (n) {
        if (n) $scope.popoverSaveOptions.instance = n;
      });

      $scope.saveChanges = function () {
        // weird hackiness to get the saving spinner to display
        $scope.saving = false;
        $timeout(function () {
          $scope.saving = true;
          $scope.$safeApply();
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
            if ($scope.restartOnSave) {
              //pgm.actions.restartInstance();
            }
            $scope.safeApply();
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
