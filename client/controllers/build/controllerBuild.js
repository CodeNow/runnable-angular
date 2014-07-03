var angular = require('angular');
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

  var self = ControllerBuild;
  var dataBuild = $scope.dataBuild = self.initState($stateParams);
  angular.extend(dataBuild, self.initPopoverState($stateParams));

  dataBuild.getPopoverButtonText = self.getPopoverButtonText;
  dataBuild.resetInputModelValue = function (event) {
    angular.extend(
      dataBuild,
      self.resetInputModelValue(
        event,
        dataBuild.inputHasBeenClicked
      )
    );
  };
  dataBuild.togglePopover = function (popoverName, event) {
    angular.extend(
      dataBuild,
      self.togglePopover(
        popoverName,
        event,
        $stateParams
      )
    );
  };

  $scope.$watch('dataBuild.isClean', function () {
    dataBuild.togglePopover();
  });

  $scope.$on('app-document-click', function () {
    dataBuild.togglePopover();
  });

  async.waterfall([
    $scope.dataApp.holdUntilAuth,
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
    },
    function newBuildVersion (project, environment, build, cb) {
      var versionId = build.toJSON().versions[0];
      var version = build.newVersion(versionId);
      cb(null, project, environment, build, version);
    },
    function fetchRootFiles (project, environment, build, version, cb) {
      var rootDirFiles = version.fetchFiles({Prefix: '/'}, function () {
        //...... TODO
      });
    }
  ], function (err, project, environment, build) {
    console.log(arguments);
    $scope.$apply(function () {});
  });


}

ControllerBuild.fetchData = function (
  async,
  user,
  $stateParams,
  cb
) {
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
    },
    function newBuildVersion (project, environment, build, cb) {
      var versionId = build.toJSON().versions[0];
      var version = build.newVersion(versionId);
      cb(null, project, environment, build, version);
    },
    function fetchRootFiles (project, environment, build, version, cb) {
      var rootDirFiles = version.fetchFiles({Prefix: '/'}, function () {
        //...... TODO
      });
    }
  ], function (err, project, environment, build) {
    console.log(arguments);
    $scope.$apply(function () {});
  });
};

ControllerBuild.resetInputModelValue = function (event, inputHasBeenClicked) {
  if (event && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }
  if (!inputHasBeenClicked) {
    return {
      buildName: '',
      inputHasBeenClicked: true
    };
  }
};

ControllerBuild.initState = function ($stateParams) {
  return {
   isClean: true,
  };
};

ControllerBuild.initPopoverState = function ($stateParams) {
  return {
    showBuildOptionsDirty: false,
    showBuildOptionsClean: false,
    showFileMenu:          false,
    buildName:             $stateParams.buildName,
    inputHasBeenClicked:   false
  };
};

ControllerBuild.getPopoverButtonText = function (name) {
  return 'Build' + ((name && name.length) ? 's in '+name : '');
};

ControllerBuild.togglePopover = function (popoverName, event, $stateParams) {
  var popovers = [
    'BuildOptionsClean',
    'BuildOptionsDirty',
    'FileMenu'
  ];
  if (typeof event !== 'undefined' && typeof event.stopPropagation === 'function') {
    event.stopPropagation();
  }
  if (typeof popoverName !== 'string' && typeof popoverName !== 'undefined') {
    throw new Error('invalid argument: ' + (typeof popoverName));
  } else if (typeof popoverName === 'string' && popovers.indexOf(popoverName) === -1) {
    throw new Error('invalid argument: ' + popoverName);
  }
  var newState = this.initPopoverState($stateParams);
  if (typeof popoverName === 'string') {
    newState['show' + popoverName] = true;
  }
  return newState;
};
