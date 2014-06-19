var app     = require('app');
var angular = require('angular');
var deps    = [
  '$scope',
  'user',
  'async',
  '$stateParams'
];
deps.push(ControllerBuild);
app.controller('ControllerBuild', deps);
function ControllerBuild ($scope,
                          user,
                          async,
                          $stateParams) {
  var dataBuild = $scope.dataBuild = {};

  async.waterfall([
    function tempHelper (cb) {
      if (user.id()) {
        cb();
      } else {
        user.login('runnableUser9', 'asdfasdf9', function () {
          cb();
        });
      }
    },
    function fetchProject (cb) {
      var projects = user.fetchProjects({
        ownerUsername: $stateParams.ownerUsername,
        name:          $stateParams.name
      }, function (err, body) {
        if(err) return cb(err); // error handling
        cb(null, projects.models[0]);
      });
    },
    function fetchEnvironment (project, cb) {
      // TODO error check
      var environmentJSON = project.toJSON().environments.filter(hasProps({name: 'master'}))[0];
      var environment = project.newEnvironment(environmentJSON);
      cb(null, project, environment);
    },
    function fetchBuild (project, environment, cb) {
      var build = environment.fetchBuild($stateParams.buildId, function (err, body) {
        if (err) return cb(err); // TODO error handling
        cb(null, project, environment, build);
      });
    }
  ], function (err, project, environment, build) {
    console.log(arguments);
    $scope.$apply(function () {});
  });

  /*
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
  */
}