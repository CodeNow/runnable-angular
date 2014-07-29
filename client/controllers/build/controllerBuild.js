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
    showRebuildMenu: false,
    buildName: $stateParams.buildName,
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

  function runBuild () {
    var newBuild = data.build.build({
      message: 'test-message'
    }, function (err, build) {
      if (err) {
        throw err;
      }
      $state.go('projects.build', angular.copy({
        buildName: newBuild.id()
      }, $stateParams));
    });
  }

  actions.rebuild = function () {
    runBuild();
  };

  actions.edit = function () {
    var newBuild = dataBuild.data.build.fork(function (err, build, code) {
      var sp = angular.copy($stateParams);
      sp.newBuildName = newBuild.id();
      $state.go('projects.buildNew', angular.copy(sp, $stateParams));
    });
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
