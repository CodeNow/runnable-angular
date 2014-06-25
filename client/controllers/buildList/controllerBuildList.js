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
                              $state,
                              async,
                              $window,
                              hasKeypaths) {

  // init data
  var dataBuildList = $scope.dataBuildList = {};
  dataBuildList.popoverChangeRecipe = {
    filter: ''
  };
  dataBuildList.showChangeRecipe = false;

  // scope event listeners
  $scope.$on('app-document-click', function () {
    dataBuildList.showChangeRecipe = false;
    dataBuildList.popoverChangeRecipe.filter = '';
  });

  // dom event callbacks
  dataBuildList.show404 = function () {
    $state.go('error', {}, {
      location: false,
      inherit:  true
    });
  };
  dataBuildList.togglePopover = function (popoverName, event) {
    event.stopPropagation();
    dataBuildList['show' + popoverName] = true;
  };
  dataBuildList.getBuildHref = function (buildId) {
    return '/' + $stateParams.userName + '/' + $stateParams.projectName + '/' + $stateParams.branchName + '/' + buildId + '/';
  };
  dataBuildList.redirectInstancePage = function (buildId) {
    $state.go('projects.instance', angular.extend({
      buildId:    buildId,
      instanceId: '555'
    }, $stateParams));
  };
  dataBuildList.redirectBuildPage = function (buildId) {
    $state.go('projects.build', angular.extend({
      buildId: buildId
    }, $stateParams));
  };

  // seed data
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
        qs: {
          ownerUsername: $stateParams.userName,
          name:          $stateParams.projectName
        }
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
      var environments = project.fetchEnvironments({
        ownerUsername: $stateParams.userName
      }, function () {
        cb(null, project, environments);
      });
      // cb(null, project, environment);
    },
    function fetchEnvironment (project, environments, cb) {
      var environment = environments.models.filter(hasKeypaths({'attrs.name': 'master'}))[0];
      cb(null, project, environments, environment);
    },
    function fetchBuilds (project, environments, environment, cb) {
      var builds = environment.fetchBuilds({}, function (err) {
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
      //console.log(dataBuildList);
    });
  });
}