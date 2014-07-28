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
  keypather,
  fetcherBuild
) {
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var self = ControllerBuild;
  var dataBuild = $scope.dataBuild = {};

  var actions = dataBuild.actions = {};
  var data = dataBuild.data = {
    showPopoverFileMenu: false,
    showPopoverFileMenuForm: false,
    showPopoverFileMenuAddReop: false,
    showPopoverRepoMenu: false,
    buildName: $stateParams.buildName,
    inputHasBeenClicked: false,
    showExplorer: true
  };

  actions.stateToBuildList = function () {
    var state = {
      userName: $stateParams.userName,
      projectName: $stateParams.projectName,
      branchName: $stateParams.branchName
    };
    $state.go('projects.buildList', state);
  };
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


  actions.runInstance = function () {
    var instance = user.createInstance({
      json: {
        name: 'name1',
        build: data.build.id()
      }
    }, function (err) {
      if (err) { throw err; }
      var state = {
        userName: $stateParams.userName,
        projectName: $stateParams.projectName,
        branchName: $stateParams.branchName,
        buildName: data.build.id(),
        instanceId: instance.id()
      };
      $state.go('projects.instance', state);
    });
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
    async.series([
      fetcherBuild($scope.dataBuild.data),
      newFilesCollOpenFiles
    ], function(){});
  };
  actions.seriesFetchAll();

}
