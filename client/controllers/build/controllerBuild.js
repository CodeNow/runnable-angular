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
  $stateParams,
  $state,
  user,
  async,
  keypather
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
  dataBuild.stateToBuildList = function (event) {
    if (angular.isFunction(keypather.get(event, 'stopPropagation'))) {
      event.stopPropagation();
    }
    var state = {
      userName:    $stateParams.userName,
      projectName: $stateParams.projectName,
      branchName:  $stateParams.branchName
    };
    $state.go('projects.buildList', state);
  };

  dataBuild.runInstance = function () {};
  dataBuild.rebuild = function () {};
  dataBuild.build = function () {};
  dataBuild.discardChanges = function () {};

  $scope.$watch('dataBuild.isClean', function () {
    dataBuild.togglePopover();
  });

  $scope.$on('app-document-click', function () {
    dataBuild.togglePopover();
  });

  async.waterfall([
    $scope.dataApp.holdUntilAuth,
    function fetchProject (thisUser, cb) {
      function updateDom () {
        if (projects.models.length) {
          dataBuild.data.project = projects.models[0];
          $scope.safeApply();
        }
      }
      var projects = thisUser.fetchProjects({
        ownerUsername: $stateParams.userName,
        name:          $stateParams.projectName
      }, function (err, body) {
        if (err) {
          return cb(err); // error handling
        }
        updateDom();
        cb();
      });
      updateDom();
    },
    function fetchEnvironment (cb) {
      var project = dataBuild.data.project;
      function updateDom () {
        if (environments.models.length) {
          dataBuild.data.environment = environments.models[0];
          $scope.safeApply();
        }
      }
      var environments = project.fetchEnvironments({
        ownerUsername: $stateParams.userName,
        name:          $stateParams.branchName
      }, function (err, results) {
        if (err) {
          return cb(err);
        }
        updateDom();
        cb();
      });
      updateDom();
    },
    function fetchBuild (cb) {
      var environment = dataBuild.data.environment;
      function updateDom () {
        if (build) {
          dataBuild.data.build = build;
          $scope.safeApply();
        }
      }
      var build = environment.fetchBuild($stateParams.buildName, function (err, body) {
        if (err) {
          return cb(err);
        }
        updateDom();
        cb();
      });
      updateDom();
    },
    function fetchBuildOwner (cb) {
      var build = dataBuild.data.build;
      function updateDom () {
        dataBuild.data.buildOwner = buildOwner;
        $scope.safeApply();
      }
      var buildOwner = user.fetchUser(build.attrs.owner, function (err) {
        if (err) {
          return cb(err);
        }
        updateDom();
        cb();
      });
      cb();
    },
    function newBuildVersion (cb) {
      cb();
      // var versionId = build.toJSON().versions[0];
      // var version = build.newVersion(versionId);
    },
    function fetchRootFiles (cb) {
      cb();
      // var rootDirFiles = version.fetchFiles({Prefix: '/'}, function () {
      //...... TODO
      // });
    }
  ], function () {
    $scope.$apply();
  });

}

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
   data:    {},
   actions: {}
  };
};

ControllerBuild.initPopoverState = function ($stateParams) {
  return {
    data: {
      showBuildOptionsDirty: false,
      showBuildOptionsClean: false,
      showFileMenu:          false,
      showForm:              false,
      buildName:             $stateParams.buildName,
      inputHasBeenClicked:   false
    }
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
