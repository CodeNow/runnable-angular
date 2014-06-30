require('app')
  .controller('ControllerBuild', ControllerBuild);
/**
 * ControllerBuild
 * @constructor
 * @export
 * @ngInject
 */
function ControllerBuild (
  $scope,
  user,
  async,
  $stateParams
) {

  this.scope = $scope;
  var self = ControllerBuild;
  var dataBuild = $scope.dataBuild = self.initState();

  dataBuild.getPopoverButtonText = self.getPopoverButtonText;
  dataBuild.resetInputModelValue = function (event) {
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
    if (dataBuild.showBuildOptionsDirty && popoverName == 'BuildOptionsDirty') {
      return;
    }
    if (dataBuild.showBuildOptionsClean && popoverName == 'BuildOptionsClean') {
      return;
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

  return this;

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

ControllerBuild.initState = function () {
 return {
   isClean: false,
   inputHasBeenClicked: false,
   showBuildOptions: false,
   buildRecipe: ''
  };
};

ControllerBuild.getPopoverButtonText = function (name) {
  return 'Build' + ((name && name.length) ? 's in '+name : '');
};
