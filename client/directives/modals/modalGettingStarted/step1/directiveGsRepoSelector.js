require('app')
  .directive('gsRepoSelector', gsRepoSelector);
/**
 * @ngInject
 */
function gsRepoSelector(
  keypather,
  errs,
  fetchGSDepInstances,
  fetchStackInfo,
  getNewForkName
) {
  return {
    restrict: 'A',
    templateUrl: 'viewSetupStackDependencies',
    scope: {
      actions: '=',
      data: '=',
      state: '='
    },
    link: function ($scope, elem, attrs) {
      function fetchStackData(repo, cb) {
        fetchStackInfo(repo, function (err, data) {
          if (err) { return cb(err); }
          keypather.set($scope, 'state.stack', data.stack);
          $scope.$watch('data.allDependencies', function (allDeps) {
            if (allDeps) {
              var includedDeps = allDeps.forEach(function (dep) {
                return data.dependencies.some(function (myDep) {
                  return myDep.attrs.name === dep.attrs.name;
                });
              });
              includedDeps.forEach(function (dep) {
                $scope.actions.addDependency(dep);
              });
            }
          });
        });
      }
      $scope.$watchCollection('state.unsavedAcvs', function (n) {
        if (n && n.length) {
          n.forEach(function(acv) {
            fetchStackData(acv.unsavedAcv.attrs.repo, errs.handler);
          });
        }
      });

      fetchGSDepInstances(function (err, deps) {
        keypather.set($scope, 'addDependencyPopover.data.dependencies', deps);
      });
      keypather.set($scope, 'addDependencyPopover.data.state.dependencies',
        $scope.state.dependencies);
    }
  };
}
