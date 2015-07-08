'use strict';

require('app')
  .directive('readOnlySwitch', readOnlySwitch);
/**
 * @ngInject
 */
function readOnlySwitch(
  $rootScope,
  errs,
  keypather,
  loadingPromises,
  promisify
) {
  return {
    restrict: 'A',
    templateUrl: 'readOnlySwitchView',
    scope: {
      state: '=',
      loadingPromisesTarget: '@?'
    },
    link: function ($scope, elem, attrs) {
      $scope.popOverServerData = {
        instance: $scope.instance
      };
      // Getter/setter
      $scope.readOnly = function (newReadOnly) {
        // when setting to readOnly
        if (arguments.length) {
          if (newReadOnly) {
            // If switching from advanced to basic
            if (confirm('You will lose all changes you\'ve made to your dockerfile (ever).')) {
              //return loadingPromises.add($scope.loadingPromisesTarget, promisify(contextVersion, 'update')({
              //  advanced: !newReadOnly
              //}));
            }
          } else {
            $scope.state.readOnly = newReadOnly;
            $scope.state.promises.contextVersion
              .then(function (contextVersion) {
                return loadingPromises.add($scope.loadingPromisesTarget, promisify(contextVersion, 'update')({
                  advanced: !newReadOnly
                }))
                  .catch(function (err) {
                    errs.handler(err);
                    $scope.state.advanced = keypather.get($scope.instance, 'contextVersion.attrs.advanced');
                  });
              });
          }
        } else {
          return $scope.state.readOnly;
        }
      };
      // Only start watching this after the context version has
      $scope.$watch('state.readOnly', function (readOnly, previousReadOnly) {
        // This is so we don't fire the first time with no changes
        if (previousReadOnly === Boolean(previousReadOnly) && readOnly !== previousReadOnly) {
          $scope.state.promises.contextVersion
            .then(function () {
              $rootScope.$broadcast('close-popovers');
              $scope.selectedTab = readOnly ? 'buildfiles' : 'repository';
              if (readOnly) {
                //openDockerfile();
              }
              return loadingPromises.add('editServerModal', promisify($scope.state.contextVersion, 'update')({
                advanced: !readOnly
              }));
            })
            .catch(function (err) {
              errs.handler(err);
              $scope.state.advanced = keypather.get($scope.instance, 'contextVersion.attrs.advanced');
            });
        }
      });

    }
  };
}
