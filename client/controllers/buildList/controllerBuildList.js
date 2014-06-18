var app  = require('app');
var deps = [
  '$scope',
  'user',
  '$stateParams',
  'async'
];
deps.push(ControllerBuildList);
app.controller('ControllerBuildList', deps);
function ControllerBuildList ($scope,
                              user,
                              $stateParams,
                              async) {
  var dataBuildList = $scope.dataBuildList = {};
  async.waterfall([
    // temporary helper
    function tempHelper (cb) {
      if (user.id()) {
        cb();
      } else {
        user.anonymous(cb);
      }
    },
    //-------
    function fetchProject (cb) {
      var projects = user.fetchProjects({
        owner: $stateParams.owner,
        name:  $stateParams.name
      }, function (err, body) {
        if (err) {
          // error handling
          return cb(err);
        }
        cb(null, projects.models[0]);
      });
    },
    function fetchEnvironment (project, cb) {
      // TODO error check
      var environmentJSON = project.toJSON().environments.filter(hasProps({name: 'master'}))[0];
      var environment = project.newEnvironment(environmentJSON);
      cb(null, project, environment);
    },
    function fetchBuilds (project, environment, cb) {
      var builds = environment.fetchBuilds(function (err) {
        if (err) return cb(err); //TODO error handling
        cb(null, project, environment, builds);
      });
    }
  ], function (err, project, environment, builds) {
    if (err) return; //TODO error handling
    dataBuildList.project     = project;
    dataBuildList.environment = environment;
    dataBuildList.builds      = builds;
  });
}