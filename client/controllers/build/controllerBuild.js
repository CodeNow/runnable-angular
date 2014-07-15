require('app')
  .controller('ControllerBuild', ControllerBuild);
/**
 * ControllerBuild
 * @constructor
 * @export
 * @ngInject
 */
function ControllerBuild(
  $scope,
  $stateParams,
  $state,
  user,
  async,
  keypather,
  extendDeep,
  SharedFilesCollection
) {

  var self = ControllerBuild;
  var dataBuild = $scope.dataBuild = self.initState($stateParams);
  // one-time initialization
  extendDeep(dataBuild.data, {
    showExplorer: true
  });
  var data = dataBuild.data;
  var actions = dataBuild.actions;

  actions.initPopoverState = function () {
    extendDeep(dataBuild, self.initPopoverState($stateParams));
  };
  actions.initPopoverState();

  actions.getPopoverButtonText = function (name) {
    return 'Build' + ((name && name.length) ? 's in ' + name : '');
  };
  actions.resetInputModelValue = function () {
    if (!data.inputHasBeenClicked) {
      data.buildName = '';
      data.inputHasBeenClicked = false;
    }
  };
  actions.toggleExplorer = function () {
    data.showExplorer = !data.showExplorer;
  };
  actions.stateToBuildList = function () {
    var state = {
      userName: $stateParams.userName,
      projectName: $stateParams.projectName,
      branchName: $stateParams.branchName
    };
    $state.go('projects.buildList', state);
  };
  actions.runInstance = function () {
    var buildId = data.build.id();
    data.thisUser.createInstance({
      name: 'testname',
      build: buildId
    }, function (err, body, code) {
    });
  };
  actions.rebuild = function () {};
  actions.build = function () {};
  actions.discardChanges = function () {};
  $scope.$watch('dataBuild.data.isClean', function () {
    actions.initPopoverState();
  });

  /* ============================
   *   API Fetch Methods
   * ===========================*/
  function fetchProject(thisUser, cb) {
    data.thisUser = thisUser;
    function updateDom() {
      if (projects.models.length) {
        data.project = projects.models[0];
        $scope.safeApply();
      }
    }
    var projects = thisUser.fetchProjects({
      ownerUsername: $stateParams.userName,
      name: $stateParams.projectName
    }, function (err, body) {
      if (err) {
        return cb(err); // error handling
      }
      updateDom();
      cb();
    });
    updateDom();
  }
  function fetchEnvironment(cb) {
    var project = data.project;
    function updateDom() {
      if (environments.models.length) {
        data.environment = environments.models[0];
        $scope.safeApply();
      }
    }
    var environments = project.fetchEnvironments({
      ownerUsername: $stateParams.userName,
      name: $stateParams.branchName
    }, function (err, results) {
      if (err) {
        return cb(err);
      }
      updateDom();
      cb();
    });
    updateDom();
  }
  function fetchBuild(cb) {
    var environment = data.environment;
    function updateDom() {
      if (build) {
        data.build = build;
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
  }
  function fetchBuildOwners(cb) {
    //TODO FIX fetchUser
    var build = data.build;
    function updateDom() {
      data.buildOwner = buildOwner;
      $scope.safeApply();
    }
    cb();
  }
  function fetchVersion(cb) {
    var build = data.build;
    var contextId = build.toJSON().contexts[0];
    var versionId = build.toJSON().contextVersions[0];
    var version = user.newContext(contextId).fetchVersion(versionId, function (err) {
      if (err) {
        return cb(err);
      }
      data.version = version;
      cb();
    });
  }
  function newFilesCollOpenFiles(cb) {
    var version = data.version;
    data.openFiles = new SharedFilesCollection(
      version.newFiles([], {client: true}),
      $scope
    );
    cb();
  }
  actions.seriesFetchAll = function () {
    async.waterfall([
      $scope.dataApp.holdUntilAuth,
      fetchProject,
      fetchEnvironment,
      fetchBuild,
      fetchBuildOwners,
      fetchVersion,
      newFilesCollOpenFiles
    ], function () {
      $scope.$apply();
    });
  };
  actions.seriesFetchAll();

}

ControllerBuild.initState = function ($stateParams) {
  return {
    data: {
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
      showRepoMenu: false,
      showForm: false,
      buildName: $stateParams.buildName,
      inputHasBeenClicked: false
    }
  };
};
