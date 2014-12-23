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
        description: 'Launch a web app running on AngularJS and Django',
        icon: 'icons-django',
        shortHash: 'e33x8e'
      }, {
        name: 'Ruby on Rails',
        description: 'Launch a Rails app with MySQL',
        icon: 'icons-ruby-on-rails',
        shortHash: 'eqq8de'
      }, {
        name: 'node.js',
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
            }, cb);
          }
        ], function (err, results) {
          if (err) { throw err; }
          var instance = results[1][0];
          if (!instance) { throw new Error(); }
          $state.go('demo.instance', {
            userName: user.attrs.accounts.github.username,
            instanceName: name
          });
        });
      };

    }
  };
}
