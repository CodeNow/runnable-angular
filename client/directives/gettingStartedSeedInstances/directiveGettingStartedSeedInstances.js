'use strict';

require('app')
  .directive('gettingStartedSeedInstances', gettingStartedSeedInstances);
/**
 * @ngInject
 */
function gettingStartedSeedInstances (
  async,
  fetchUser,
  $state
) {
  return {
    restrict: 'E',
    templateUrl: 'viewGettingStartedSeedInstances',
    replace: true,
    scope: {},
    link: function ($scope, elem, attrs) {

      var user;

      $scope.helloRunnableInstances = [{
        name: 'Django',
        instanceName: 'Django',
        description: 'Launch a web app running on AngularJS and Django',
        icon: 'icons-django',
        shortHash: 'e33x8e'
      }, {
        name: 'Ruby on Rails',
        instanceName: 'RubyOnRails',
        description: 'Launch a Rails app with MySQL',
        icon: 'icons-ruby-on-rails',
        shortHash: 'eqq8de'
      }, {
        name: 'node.js',
        instanceName: 'NodeJS',
        description: 'I don\'t even know right now',
        icon: 'icons-node.js',
        shortHash: 'ewzkne'
      }];

      $scope.forkInstance = function (shortHash, name) {
        async.series([
          function (cb) {
            fetchUser(function (err, fetchedUser) {
              if (err) { return cb(err); }
              user = fetchedUser;
              cb();
            });
          },
          function newTempInstanceModel (cb) {
            var tempInstance = user.newInstance({
              shortHash: shortHash
            });
            tempInstance.copy({
              name: name
            }, function (err, instanceAttrs, code) {
              cb(null, instanceAttrs, code);
              if (err) { throw err; }
            });
          }
        ], function (err, results) {
          var instance = results[1][0];
          var instanceCode = results[1][1];
          // already exists
          $state.go('demo.instance', {
            userName: user.attrs.accounts.github.username,
            instanceName: name
          });
          if (parseInt(instanceCode) === 409) {
            throw new Error('instance already exists');
          }
        });
      };

    }
  };
}
