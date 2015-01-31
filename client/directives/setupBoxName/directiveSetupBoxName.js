'use strict';

require('app')
  .directive('setupBoxName', setupBoxName);
/**
 * @ngInject
 */
function setupBoxName(
  async,
  determineActiveAccount,
  QueryAssist,
  fetchUser,
  $rootScope,
  user
) {
  return {
    restrict: 'A',
    templateUrl: 'viewSetupBoxName',
    scope: {
      newInstanceName: '=name',
      valid: '='
    },
    link: function ($scope, elem, attrs) {

      $scope.newInstanceName = '';

      $scope.$watch('newInstanceNameForm.$valid', function () {
        $scope.valid = arguments[0];
      });

      function fetchInstances(cb) {
        async.waterfall([
          determineActiveAccount,
          function (activeAccount, cb) {
            $scope.activeAccount = activeAccount;
            cb();
          },
          function (cb) {
            new QueryAssist($scope.user, cb)
              .wrapFunc('fetchInstances', cb)
              .query({
                owner: {
                  github: $scope.activeAccount.oauthId()
                }
              })
              .cacheFetch(function (instances, cached, cb) {
                $scope.instances = instances;
                cb();
              })
              .resolve(function (err, projects, cb) {
                if (err) { throw err; }
              })
              .go();
          }
        ]);
      }

      async.series([
        function (cb) {
          fetchUser(function(err, user) {
            if (err) { return cb(err); }
            $scope.user = user;
            cb();
          });
        },
        fetchInstances
      ]);
    }
  };
}
