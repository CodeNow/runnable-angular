require('app')
  .controller('ControllerGettingStarted', ControllerGettingStarted);
/**
 * ControllerSetup
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerGettingStarted(
  async,
  $scope,
  $rootScope,
  $state,
  $stateParams,
  keypather,
  errs,
  OpenItems,
  fetchUser,
  $window
) {

  var dataSetup = $scope.dataSetup = {
    data: {
      stackData: {}
    },
    actions: {}
  };
  var data = dataSetup.data;
  $scope.data = {
    stacks: [{
      //'Ruby on Rails': {
      name: 'Ruby on Rails',
      versionReqs: [
        {
          name: 'Ruby',
          selected: '10',
          versions: [
            '10',
            '9',
            '8'
          ]
        }, {
          name: 'Rails',
          selected: '2',
          versions: [
            '3',
            '2',
            '1'
          ]
        }
      ],
      ports: [80, 3000],
      startCommand: 'rails server'
    }, {
      //'Node': {
      name: 'Node',
      versionReqs: [{
        name: 'Node',
        selected: '.10.9',
        versions: [
          '.10.9',
          '.10.8',
          '.11'
        ]
      }],
      ports: [80],
      startCommand: 'npm start'
    }, {
      //'Angular': {
      name: 'Angular',
      versionReqs: [
        {
          name: 'Node',
          selected: '.10.9',
          versions: [
            '.10.9',
            '.10.8',
            '.11'
          ]
        }, {
          name: 'Angular',
          selected: '1.3',
          versions: [
            '1.3',
            '1.2',
            '.9'
          ]
        }
      ],
      ports: [80],
      startCommand: '//Do some stuff'
    }],
    dependencies: {
      models: [{
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
      }]
    }
  };
  $scope.state = {};

  keypather.set($scope, 'state.stack', $scope.data.stacks[0]);
  keypather.set($scope, 'state.dependencies', angular.copy($scope.data.dependencies));

  $scope.$on('$destroy', function () {
  });

}
