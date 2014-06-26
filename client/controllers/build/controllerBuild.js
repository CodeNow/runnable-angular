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
  debugger;
  dataBuild.isClean = true;
  dataBuild.showClean = dataBuild.isClean;
  dataBuild.showDirty = !dataBuild.isClean;
  dataBuild.leaveIconAnimation = function () {};
  dataBuild.toggleClean = function () {
    dataBuild.isClean = !dataBuild.isClean;
    dataBuild.showClean = false;
    if (dataBuild.isClean) {
      dataBuild.leaveIconAnimation = function () {
        $scope.$apply(function () {
          dataBuild.showClean = true;
        });
      };
      dataBuild.showDirty = false;
    } else {
      dataBuild.leaveIconAnimation = function () {
        $scope.$apply(function () {
          dataBuild.showDirty = true;
        });
      };
      dataBuild.showClean = false;
    }
  };

  // popoverBuildOptions
  dataBuild.showBuildOptions = false;
  dataBuild.showRebuildOptions = false;

  // scope event listeners
  $scope.$on('app-document-click', function () {
    dataBuild.showBuildOptions = false;
    dataBuild.showRebuildOptions = false;
  });

  dataBuild.togglePopover = function (popoverName, event) {
    event.stopPropagation();
    dataBuild['show' + popoverName] = true;
  };

  // async.waterfall([
  //   function tempHelper (cb) {
  //     if (user.id()) {
  //       cb();
  //     } else {
  //       user.login('runnableUser9', 'asdfasdf9', function () {
  //         cb();
  //       });
  //     }
  //   },
  //   function fetchProject (cb) {
  //     var projects = user.fetchProjects({
  //       ownerUsername: $stateParams.ownerUsername,
  //       name:          $stateParams.name
  //     }, function (err, body) {
  //       if(err) return cb(err); // error handling
  //       cb(null, projects.models[0]);
  //     });
  //   },
  //   function fetchEnvironment (project, cb) {
  //     // TODO error check
  //     var environmentJSON = project.toJSON().environments.filter(hasProps({name: 'master'}))[0];
  //     var environment = project.newEnvironment(environmentJSON);
  //     cb(null, project, environment);
  //   },
  //   function fetchBuild (project, environment, cb) {
  //     var build = environment.fetchBuild($stateParams.buildId, function (err, body) {
  //       if (err) return cb(err); // TODO error handling
  //       cb(null, project, environment, build);
  //     });
  //   },
  //   function newBuildVersion (project, environment, build, cb) {
  //     var versionId = build.toJSON().versions[0];
  //     var version = build.newVersion(versionId);
  //     cb(null, project, environment, build, version);
  //   },
  //   function fetchRootFiles (project, environment, build, version, cb) {
  //     var rootDirFiles = version.fetchFiles({Prefix: '/'}, function () {
  //       //...... TODO
  //     });
  //   }
  // ], function (err, project, environment, build) {
  //   console.log(arguments);
  //   $scope.$apply(function () {});
  // });

}
