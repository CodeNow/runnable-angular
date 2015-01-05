require('app')
  .directive('setupStackDependencies', setupStackDependencies);
/**
 * @ngInject
 */
function setupStackDependencies(
  keypather
) {
  return {
    restrict: 'A',
    templateUrl: 'viewSetupStackDependencies',
    scope: {
      state: '='
    },
    link: function ($scope, elem, attrs) {
      keypather.set($scope, 'actions.addDep', function (model) {
        console.log('Add Model', model);
        var index = $scope.state.dependencies.models.indexOf(model);
        if (index === -1) {
          $scope.state.dependencies.models.push(model);
        }
      });
      keypather.set($scope, 'actions.removeDep', function (model) {
        console.log('remove Model', model);
        var index = $scope.state.dependencies.models.indexOf(model);
        if (index !== -1) {
          $scope.state.dependencies.models.splice(index, 1);
        }
      });

      var availableDependencies = {
        models: [
          {
            attrs: {
              name: 'MySQL',
              _id: 1002
            },
            requiredEnvs: [
              {
                envName: 'port1',
                url: 'http://mysql.user.runnable3.net:3000'
              }
            ]
          }, {
            attrs: {
              name: 'Angular',
              _id: 1003
            },
            requiredEnvs: [
              {
                envName: 'port1',
                url: 'http://Angular.user.runnable3.net'
              }
            ]
          }, {
            attrs: {
              name: 'Cheese',
              _id: 1004
            },
            requiredEnvs: [
              {
                envName: 'port1',
                url: 'http://Cheese.user.runnable3.net'
              }, {
                envName: 'port2',
                url: 'http://Cheese.user.runnable3.net:3000'
              }
            ]
          }, {
            attrs: {
              name: 'Redis',
              _id: 10
            },
            requiredEnvs: [
              {
                envName: 'port1',
                url: 'http://Redis.user.runnable3.net'
              }, {
                envName: 'port2',
                url: 'http://Redis.user.runnable3.net:27107'
              }
            ]
          }, {
            attrs: {
              name: 'Postgres',
              _id: 11
            },
            requiredEnvs: [
              {
                envName: 'port1',
                url: 'http://Postgres.user.runnable3.net'
              }, {
                envName: 'port2',
                url: 'http://Postgres.user.runnable3.net:3000'
              }
            ]
          }, {
            attrs: {
              name: 'Grunt',
              _id: 12
            },
            requiredEnvs: [
              {
                envName: 'port1',
                url: 'http://Grunt.user.runnable3.net'
              }, {
                envName: 'port2',
                url: 'http://Grunt.user.runnable3.net:3000'
              }
            ]
          }
        ]
      };

      keypather.set($scope, 'addDependencyPopover.data.dependencies', availableDependencies);
      keypather.set($scope, 'addDependencyPopover.data.state.dependencies',
        $scope.state.dependencies);
    }
  };
}
