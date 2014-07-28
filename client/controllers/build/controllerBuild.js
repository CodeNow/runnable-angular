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
  SharedFilesCollection,
  keypather
) {
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var self = ControllerBuild;
  var dataBuild = $scope.dataBuild = self.initState($stateParams);
  var data = dataBuild.data;
  var actions = dataBuild.actions;
  window.dataBuild = dataBuild;

  // one-time initialization
  extendDeep(dataBuild.data, {
    showExplorer: true
  });

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

  actions.forkBuild = function (cb) {
    var build = dataBuild.data.build;
    var started = keypather.get(data, 'build.attrs.started');
    if (!build) {
      return cb(new Error('no build'));
    }
    if (!started) {
      return cb();
    }
    var newBuild = build.fork(function () {
      cb(null, newBuild);
      console.log(arguments);
    });
  };

  var runBuild = function(buildFunc) {
    var newBuild = buildFunc(function (err, build) {
      if (err) {
        throw err;
      }
      data.build = newBuild;
      actions.initStream();
      data.closed = false;
      $scope.safeApply();
    });
  };

  actions.build = function () {
    runBuild(data.build.build.bind(data.build));
  };
  actions.rebuild = function () {
    runBuild(data.build.rebuild.bind(data.build));
  };
  actions.discardChanges = function () {
  };

  /**
   * If this build is built, we want to wait for changes and then trigger a fork
   */
  $scope.$watch('dataBuild.data.openFiles.activeFile.attrs.body', function (newval, oldval) {
    var started = keypather.get(dataBuild.data, 'build.attrs.started');
    if (!started || (typeof started === 'string' && !started.length)) {
      return;
    }
    if (oldval === undefined || (newval === oldval)) {
      return;
    }
    dataBuild.actions.forkBuild();
  });

/*
  $scope.$watch('dataBuild.data.openFiles.activeFile.attrs._id', function (newval, oldval) {
    if (newval === oldval) {
      // We've opened the same file
      return;
    }
    var file = dataBuild.data.openFiles.activeFile;
    var version = dataBuild.data.version;
    file = version.fetchFile(file.id(), function () {
      $scope.safeApply();
    });
  });
*/

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
      .wrapFunc('fetchBuilds')
      .query({
        buildNumber: $stateParams.buildName,
        environment: data.environment.id()
      })
      .cacheFetch(function updateDom(builds, cached, cb) {
        if (!builds.models.length) {
          actions.stateToBuildList();
        }
        else {
          var build = builds.models[0];
          dataBuild.data.build = build;
          dataBuild.data.version = build.contextVersions.models[0];
          $scope.safeApply();
          if (build.attrs.contextVersions.length){
            cb();
          }
        }
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
      newFilesCollOpenFiles
    ], function () {
      $scope.$apply();
    });
  };
  actions.seriesFetchAll();
}

ControllerBuild.initState = function ($stateParams) {
  return {
    data: {},
    actions: {}
  };
};

ControllerBuild.initPopoverState = function ($stateParams) {
  return {
    data: {
      showPopoverFileMenu: false,
      showPopoverFileMenuForm: false,
      showPopoverFileMenuAddReop: false,

      showPopoverRepoMenu: false,

      buildName: $stateParams.buildName,
      inputHasBeenClicked: false
    }
  };
};
