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
  OpenItems,
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
    showExplorer: false
  };

  /***************************************
   * Rebuild Popover
   **************************************/
  var rbpo = dataBuild.data.rbpo = {};
  rbpo.data = {};
  rbpo.actions = {};

  rbpo.data.show = false;
  rbpo.data.environmentName = '';
  rbpo.data.buildMessage = '';
  rbpo.data.popoverInputHasBeenClicked = false;

  function setupBuildPopover () {
    rbpo.data.project = dataBuild.data.project;
  }

  rbpo.actions.build = function () {
    if (rbpo.data.environmentName === '') {
      return;
    }
    var environment = dataBuild.data.project.environments.find(function (m) {
      return m.attrs.name === rbpo.data.environmentName;
    });
    function createEnvironment () {
      dataBuild.data.forkedEnvironment = dataBuild.data
      .project.environments.create({
        name: rbpo.data.environmentName
      }, function (err) {
        if (err) throw err;
        dataBuild.actions.rebuild();
      });
    }
    if (environment) {
      dataBuild.data.forkedEnvironment = environment;
      dataBuild.actions.rebuild();
    } else {
      createEnvironment();
    }
  };

  rbpo.actions.getPopoverButtonText = function (name) {
    return 'Build' + ((name && name.length) ? 's in ' + name : '');
  };

  rbpo.actions.resetInputModelValue = function ($event) {
    if (!rbpo.data.popoverInputHasBeenClicked) {
      return;
    }
    rbpo.data.environmentName = '';
    rbpo.data.popoverInputHasBeenClicked = true;
  };

  /**************************************/

  actions.stateToBuildList = function () {
    var state = {
      userName: $stateParams.userName,
      projectName: $stateParams.projectName,
      branchName: $stateParams.branchName
    };
    $state.go('projects.buildList', state);
  };

  actions.runInstance = function () {
    $scope.dataApp.data.loading = true;
    var instance = user.createInstance({
      json: {
        build: data.build.id()
      }
    }, function (err) {
      if (err) {
        throw err;
      }
      $scope.dataApp.data.loading = false;
      var state = {
        instanceId: instance.id(),
        userName: $state.params.userName
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

  actions.rebuild = function () {
    var buildObj = {
      message: (rbpo.data.buildMessage || 'Manual Rebuild')
    };
    if (data.forkedEnvironment) {
      buildObj.environment = data.forkedEnvironment.id();
      buildObj.parentBuild = data.build.id();
      var forkedBuild = data.forkedEnvironment.createBuild(buildObj,
        function (err) {
          if (err) throw err;

          forkedBuild.build({
            message: buildObj.message
          }, function (err) {
            if (err) throw err;

            $state.go('projects.build', angular.copy({
              buildName: forkedBuild.attrs.buildNumber,
              branchName: data.forkedEnvironment.attrs.name
            }, $stateParams));
          });
        });
    } else {
      var newBuild = data.build.rebuild(buildObj,
        function (err, build) {
          if (err) throw err;
          $state.go('projects.build', angular.copy({
            buildName: newBuild.attrs.buildNumber
          }, $stateParams));
        });
    }
  };

  actions.edit = function () {
    var newBuild = dataBuild.data.build.fork(function (err, build, code) {
      if (err) {
        throw err;
      }
      var sp = angular.copy($stateParams);
      sp.newBuildName = newBuild.id();
      $state.go('projects.buildNew', sp);
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

  $scope.$watch('dataBuild.data.build.attrs.completed', function(n) {
    if (n) {
      data.showExplorer = true;
    }
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

  function fetchOwnerRepos(cb) {
    var thisUser = $scope.dataApp.user;
    var build = data.build;
    var query;

    if (thisUser.isOwnerOf(data.project)) {
      query = new QueryAssist(thisUser, cb)
        .wrapFunc('fetchGithubRepos');
    } else {
      var githubOrg = thisUser.newGithubOrg($scope.dataApp.stateParams.userName);
      query = new QueryAssist(githubOrg, cb)
        .wrapFunc('fetchRepos');
    }
    query
      .query({})
      .cacheFetch(function updateDom(githubRepos, cached, cb) {
        data.githubRepos = githubRepos;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, githubRepos, cb) {
        if (!githubRepos) {
          return cb(new Error('GitHub repos not found'));
        }
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  function newOpenItems(cb) {
    data.openItems = new OpenItems();
    data
      .openItems.addBuildStream({
        name: 'Build Stream'
      })
      .state.alwaysOpen = true;
    $scope.safeApply();
    cb();
  }

  actions.seriesFetchAll = function () {
    async.series([
      fetcherBuild($scope.dataBuild.data),
      fetchOwnerRepos,
      newOpenItems
    ], function (err) {
      setupBuildPopover();
      if (err) {
        $state.go('404');
        throw err;
      }
    });
  };
  actions.seriesFetchAll();

}
