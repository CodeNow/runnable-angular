var app  = require('app');
var deps = [
  '$scope',
  'user',
  '$stateParams',
  'async',
  '$window',
  'hasProps'
];
deps.push(ControllerBuildList);
app.controller('ControllerBuildList', deps);
function ControllerBuildList ($scope,
                              user,
                              $stateParams,
                              async,
                              $window,
                              hasProps) {

  var dataBuildList = $scope.dataBuildList = {};
  dataBuildList.popoverChangeRecipe = {};

  $scope.$on('app-document-click', function () {
    dataBuildList['showChangeRecipe'] = false;
    dataBuildList['popoverChangeRecipe'].filter = '';
  });
  dataBuildList.togglePopover = function (popoverName, event) {
    event.stopPropagation();
    dataBuildList['show' + popoverName] = true;
  };

  async.waterfall([
    // temporary helper
    function tempHelper (cb) {
      if (user.id()) {
        cb();
      } else {
        //user.anonymous(function () { cb(); });
        user.login('runnableUser9', 'asdfasdf9', function () { cb(); });
      }
    },
    //-------
    function fetchProject (cb) {
      var projects = user.fetchProjects({
        ownerUsername: $stateParams.ownerUsername,
        name:          $stateParams.name
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
    if (err) return; // TODO error handling
    $scope.$apply(function () {
      dataBuildList.project     = project;
      dataBuildList.environment = environment;
      dataBuildList.builds      = builds;
    });
  });
}