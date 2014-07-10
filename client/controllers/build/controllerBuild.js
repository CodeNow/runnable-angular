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
  keypather,
  extendDeep
) {

  var self = ControllerBuild;
  var dataBuild = $scope.dataBuild = self.initState($stateParams);
  extendDeep(dataBuild, self.initPopoverState($stateParams));
  // one-time initialization
  extendDeep(dataBuild.data, {
    showExplorer: true
  });

  dataBuild.actions.getPopoverButtonText = self.getPopoverButtonText;
  dataBuild.actions.resetInputModelValue = function (event) {
    extendDeep(
      dataBuild,
      self.resetInputModelValue(
        event,
        dataBuild.data.inputHasBeenClicked
      )
    );
  };
  dataBuild.actions.togglePopover = function (popoverName, event) {
    extendDeep(
      dataBuild,
      self.togglePopover(
        popoverName,
        event,
        $stateParams
      )
    );
  };
  dataBuild.actions.toggleExplorer = function (event) {
    if (angular.isFunction(keypather.get(event, 'stopPropagation'))) {
      event.stopPropagation();
    }
    dataBuild.data.showExplorer = !dataBuild.data.showExplorer;
  };
  dataBuild.actions.stateToBuildList = function (event) {
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

  dataBuild.actions.runInstance = function () {};
  dataBuild.actions.rebuild = function () {};
  dataBuild.actions.build = function () {};
  dataBuild.actions.discardChanges = function () {};

  $scope.$watch('dataBuild.data.isClean', function () {
    dataBuild.actions.togglePopover();
  });

  $scope.$on('app-document-click', function () {
    dataBuild.actions.togglePopover();
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
    function fetchVersion (cb) {
      var build = dataBuild.data.build;
      var contextId = build.toJSON().contexts[0];
      var versionId = build.toJSON().contextVersions[0];
      var version = user.newContext(contextId).fetchVersion(versionId, function (err) {
        if (err) {
          return cb(err);
        }
        dataBuild.data.version = version;
        cb();
      });
    },
    function fetchBuildFiles (cb) {
      var version = dataBuild.data.version;
      var buildFiles = version.fetchFiles(function (err) {
        if (err) {
          return cb(err);
        }
        dataBuild.data.buildFiles = buildFiles;
        cb();
      });
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
      data:{
        buildName: '',
        inputHasBeenClicked: true
      }
    };
  }
};

ControllerBuild.initState = function ($stateParams) {
  return {
   data:    {
     isClean: true
   },
   actions: {}
  };
};

ControllerBuild.initPopoverState = function ($stateParams) {
  return {
    data: {
      showBuildOptionsDirty: false,
      showBuildOptionsClean: false,
      // showExplorer:          true,
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
    'BuildOptionsDirty'
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
    newState.data['show' + popoverName] = true;
  }
  return newState;
};
