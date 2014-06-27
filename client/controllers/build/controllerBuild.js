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
  dataBuild.isClean = true;
  dataBuild.showClean = dataBuild.isClean;
  dataBuild.showDirty = !dataBuild.isClean;
  dataBuild.inputHasBeenClicked = false;
  dataBuild.leaveIconAnimation = function () {};
  dataBuild.showBuildOptions = false;

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
  dataBuild.getPopoverButtonText = function () {
    var msg = 'Build';
    if (dataBuild.buildRecipe.length) {
      msg += ' in ' + dataBuild.buildRecipe;
    }
    return msg;
  };
  dataBuild.decideIfResetModelValue = function (event) {
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    if (!dataBuild.inputHasBeenClicked) {
      dataBuild.buildRecipe = '';
      dataBuild.inputHasBeenClicked = true;
    }
  };
  dataBuild.togglePopover = function (popoverName, event) {
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    dataBuild.buildRecipe = $scope.dataApp.stateParams.branchName;
    dataBuild.inputHasBeenClicked = false;
    dataBuild.showBuildOptionsClean = false;
    dataBuild.showBuildOptionsDirty = false;
    if(popoverName === 'BuildOptionsClean' || popoverName === 'BuildOptionsDirty') {
      dataBuild['show' + popoverName] = true;
    }
  };
  $scope.$watch('dataBuild.isClean', function () {
    dataBuild.togglePopover();
  });
  $scope.$on('app-document-click', function () {
    dataBuild.togglePopover();
    dataBuild.showBuildOptions = false;
  });





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
