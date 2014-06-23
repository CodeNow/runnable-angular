var app  = require('app');
app.controller('ControllerBuildList', ControllerBuildList);
/**
 * ControllerBuildList
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerBuildList ($scope,
                              user,
                              $stateParams,
                              async,
                              $window,
                              hasKeypaths) {

  var dataBuildList = $scope.dataBuildList = {};

  // init
  dataBuildList.popoverChangeRecipe = {
    filter: ''
  };
  dataBuildList.showChangeRecipe = false;

  $scope.$on('app-document-click', function () {
    dataBuildList.showChangeRecipe = false;
    dataBuildList.popoverChangeRecipe.filter = '';
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
    function fetchEnvironments (project, cb) {
      // TODO error check
      // var environmentJSON = project.toJSON().environments.filter(hasProps({name: 'master'}))[0];
      // var environment = project.newEnvironment(environmentJSON);
      var environments = project.fetchEnvironments({ownerUsername: $stateParams.ownerUsername}, function () {
        cb(null, project, environments);
      });
      // cb(null, project, environment);
    },
    function fetchEnvironment (project, environments, cb) {
      var environment = environments.models.filter(hasKeypaths({'attrs.name': 'master'}))[0];
      cb(null, project, environments, environment);
    },
    function fetchBuilds (project, environments, environment, cb) {
      var builds = environment.fetchBuilds(function (err) {
        if (err) return cb(err); //TODO error handling
        cb(null, project, environments, environment, builds);
      });
    }
  ], function (err, project, environments, environment, builds) {
    if (err) return; // TODO error handling
    $scope.$apply(function () {
      dataBuildList.project      = project;
      dataBuildList.environments = environments;
      dataBuildList.environment  = environment;
      dataBuildList.builds       = builds;
      console.log(dataBuildList);
    });
  });
}