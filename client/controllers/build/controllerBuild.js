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
  extendDeep,
  SharedFilesCollection
) {
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var self = ControllerBuild;
  var dataBuild = $scope.dataBuild = self.initState($stateParams);
  // one-time initialization
  extendDeep(dataBuild.data, {
    showExplorer: true
  });
  var data = dataBuild.data,
    actions = dataBuild.actions;

  // Trigger digest cycle every minute to update 'Initiated'
  setInterval($scope.safeApply, 60 * 1000);

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
      data.inputHasBeenClicked = true;
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
    var instance = user.createInstance({
      json: {
        name: 'name1',
        build: data.build.id()
      }
    }, function () {});
  };
  actions.createRepo = function () {
    var version = dataBuild.data.version;
    var repo = version.addGithubRepo({
      repo: 'cflynn07/dotfiles'
    }, function (err, res) {
      version.fetch(function () {
        $scope.safeApply();
      });
    });
  };
  actions.rebuild = function () {};
  actions.build = function () {};
  actions.discardChanges = function () {};

  $scope.$watch('dataBuild.data.isClean', function () {
    actions.initPopoverState();
  });
  $scope.$watch('dataBuild.data.openFiles.activeFile.attrs._id', function (newval, oldval) {
    if (newval === oldval) {
      return;
    }
    var file = dataBuild.data.openFiles.activeFile;
    var version = dataBuild.data.version;
    file = version.fetchFile(file.id(), function () {
      $scope.safeApply();
    });
  });

  /* ============================
   *   API Fetch Methods
   * ===========================*/
  function fetchProject(cb) {
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchProjects')
      .query({
        ownerUsername: $stateParams.userName,
        name: $stateParams.projectName
      })
      .cacheFetch(function updateDom(projects, cached, cb) {
        dataBuild.data.project = projects.models[0];
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, projects, cb) {
        if (err) {
          // TODO
          // 404
        }
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function fetchEnvironment(cb) {
    new QueryAssist(dataBuild.data.project, cb)
      .wrapFunc('fetchEnvironments')
      .query({
        ownerUsername: $stateParams.userName,
        name: $stateParams.branchName
      })
      .cacheFetch(function updateDom(environments, cached, cb) {
        dataBuild.data.environment = environments.models[0];
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, environments, cb) {
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function fetchBuild(cb) {
    new QueryAssist(dataBuild.data.environment, cb)
      .wrapFunc('fetchBuild')
      .query($stateParams.buildName)
      .cacheFetch(function updateDom(build, cached, cb) {
        dataBuild.data.build = build;
        $scope.safeApply();
        if (build.attrs.contextVersions.length){
          cb();
        }
      })
      .resolve(function (err, build, cb) {
        if (build.attrs.completed) {
          dataBuild.data.buildTime = (new Date(build.attrs.completed) - new Date(build.attrs.started)) / 1000;
        }
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function fetchBuildOwners(cb) {
    //TODO FIX fetchUser
    /*
    var build = data.build;
    function updateDom() {
      data.buildOwner = buildOwner;
      $scope.safeApply();
    }
    */
    cb();
  }

  function fetchVersion(cb) {
    var build = data.build;
    var contextId = build.toJSON().contexts[0];
    var versionId = build.toJSON().contextVersions[0];
    var context = user.newContext(contextId);
    new QueryAssist(context, cb)
      .wrapFunc('fetchVersion')
      .query(versionId)
      .cacheFetch(function updateDom(version, cached, cb) {
        dataBuild.data.version = version;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, build, cb) {
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function newFilesCollOpenFiles(cb) {
    var version = dataBuild.data.version;
    data.openFiles = new SharedFilesCollection(
      version.newFiles([], {
        noStore: true
      }),
      $scope
    );
    cb();
  }
  actions.seriesFetchAll = function () {
    async.waterfall([
      holdUntilAuth,
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
      showAddRepo: false,

      buildName: $stateParams.buildName,
      inputHasBeenClicked: false
    }
  };
};
