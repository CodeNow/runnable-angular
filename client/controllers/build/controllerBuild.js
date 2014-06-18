var app     = require('app');
var angular = require('angular');
var deps    = [
  '$scope',
  'user',
  'async',
  'ensureAnonymous',
  '$stateParams'
];
deps.push(ControllerBuild);
app.controller('ControllerBuild', deps);
function ControllerBuild ($scope,
                          user,
                          async,
                          ensureAnonymous,
                          $stateParams) {
  var dataBuild = $scope.dataBuild = {};
  ensureAnonymous(user, function (err) {
    if (err) {
      console.log('err', err);
      return;
    }
    async.parallel({
      user: function (cb) {
        //var user = user.fetchUser... ?
        user.fetchUsers({
          username: $stateParams.owner
        }, cb);
      },
      projectAndInstance: function (cb) {
        //var project = user.fetchProject... ?
        async.waterfall([
          function fetchProject (cb) {
            var project = user.fetchProjects({
              owner: $stateParams.owner,
              name:  $stateParams.project.replace(/-/g, ' ') //move inside npm module?
            }, cb);
          },
          function fetchInstance (project, cb) {
            // FIXME: check project exists,
            // FIXME: check default environment exists
            user.createInstance({
              environment: project.toJSON().defaultEnvironment
            }, cb);
          }
        ], function (err, results) {
          cb(err, {
            project: project,
            instance: instance
          });
        });
      }
    }, function (err, results) {
      if (err) {
        // display 404 page
        console.log('err', err);
        return;
      }
      // angular.extend(dataBuild, results);
    });
  });
}