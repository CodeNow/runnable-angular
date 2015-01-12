'use strict';

require('app')
  .directive('modalForkBox', modalForkBox);
/**
 * directive modalForkBox
 *
 * Whichever version (opts vs attrs) the env modal will display will be based on the flip of
 * the forkedInstance boolean.  The opts object will be the state version, and will be kept
 * in a list, with the root element as 0, and the dependencies in the same order as in the model.
 * In this object will be the envs, and the new name.  This will be added to a new object
 * containing the instance and the opts, before it is sent to the forkInstance function.  The
 * updateEnv service will always use the original envs to replace it
 *
 *
 *
 * @ngInject
 */
function modalForkBox(
  getNewForkName,
  updateEnvName,
  keypather,
  debounce,
  $rootScope
) {
  return {
    restrict: 'E',
    templateUrl: 'viewModalForkBox',
    scope: {
      data: '=',
      actions: '=',
      defaultActions: '='
    },
    link: function ($scope, element, attrs) {
      // opts is an array
      $scope.unwatchItems = [];
      $scope.items = [createItem($scope.data.instance)];
      createInstanceWatchers(0);
      $scope.devItems = [];
      $scope.data.forkDependencies = true;

      $scope.$watch('items.length', function (n) {
        if (!n) { return; }
        if (n === 1) {
          if ($scope.unwatchItems.length) {
            $scope.unwatchItems.forEach(function (unWatch) {
              unWatch();
            });
            $scope.unwatchItems = [];
          }
          updateEnvName($scope.items);
        }
        for (var idx = 1; idx < n; idx++ ) {
          $scope.unwatchItems.push(createInstanceWatchers(idx));
        }
      });

      $scope.$watch('data.forkDependencies', function (n) {
        // When this flips, add or remove the deps from the item list
        if (!n && $scope.items.length > 1) {
          $scope.items.splice(1);
          $scope.devItems = [];
        } else if (n && $scope.items.length === 1) {
          var unwatch = $scope.$watch('data.instance.dependencies.models.length', function (n) {
            if (!n) { return; }
            unwatch();
            $scope.data.instance.dependencies.models.forEach(function (instance) {
              var item = createItem(instance);
              $scope.items.push(item);
              $scope.devItems.push(item);
            });
          });
        }
      });
      var dUpdateEnvName = debounce(function (items) {
        updateEnvName(items);
      }, 250);

      function createItem(instance) {
        var item = {
          instance: instance,
          opts: {
            name: getNewForkName(instance, $scope.data.instances)
          },
          attrs: {}
        };
        if (keypather.get(instance, 'attrs.env.length')) {
          item.opts.env = instance.attrs.env;
          item.attrs.env = instance.attrs.env;
        }
        return item;
      }
      function createInstanceWatchers(index) {
        return $scope.$watch('items[' + index + '].opts.name', function (n) {
          if (!n) {
            return;
          }
          dUpdateEnvName($scope.items);
        });
      }
    }
  };
}
