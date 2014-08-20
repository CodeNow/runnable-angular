require('app')
  .controller('ControllerBuildNew', ControllerBuildNew);
/**
 * ControllerBuildNew
 * @constructor
 * @export
 * @ngInject
 */
function ControllerBuildNew(
  $scope,
  $stateParams,
  $state,
  user,
  async,
  extendDeep,
  OpenItems,
  keypather,
  fetcherBuild,
  hasProps,
  getNewFileFolderName
) {
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var dataBuildNew = $scope.dataBuildNew = {};
  var actions = dataBuildNew.actions = {};
  var data = dataBuildNew.data = {
    showBuildMenu: false,
    newBuildName: '?',
    showExplorer: false
  };

  $scope.$watch('dataBuildNew.data.build.attrs.completed', function(n) {
    if (n) {
      data.showExplorer = true;
    }
  });

  data.popoverBuildOptions = {
    actions: {},
    data: {}
  };
  var pbo = data.popoverBuildOptions;
  pbo.data.show = false;

  /**************************************
   * File Tree Gear Modal Menu
   **************************************/
  var ftgm = data.fileTreeGearMenu = {};
  ftgm.actions = {
    create: function (isDir) {
      if(!keypather.get(dataBuildNew, 'data.newVersion.rootDir')) {
        return;
      }
      ftgm.data.show = false;
      var dir = dataBuildNew.data.newVersion.rootDir;
      var name = getNewFileFolderName(dir);
      dir.contents.create({
        name: name,
        isDir: isDir
      }, function (err) {
        if (err) {
          throw err;
        }
        dir.contents.fetch(function (err) {
          if (err) {
            throw err;
          }
          $scope.safeApply();
        });
      });
    }
  };
  ftgm.data = {
    show: false
  };

  /**************************************
   * DataTreeFilePopoverRepoItemMenu
   **************************************/
  data.dataFileTreePopoverRepoItemMenu = {};
  var repoCMData = data.dataFileTreePopoverRepoItemMenu.data = {};
  var repoCMActions = data.dataFileTreePopoverRepoItemMenu.actions = {};
  repoCMData.show = false;

  /**************************************
   * BuildPopoverRepoMenu
   **************************************/
  var buildPopoverRepoMenu = data.buildPopoverRepoMenu = {};

  function setupRepoPopover() {
    buildPopoverRepoMenu.data = {
      show: false,
      appCodeVersions: keypather.get(data, 'newVersion.appCodeVersions'),
      githubRepos: keypather.get(data, 'githubRepos')
    };
  }
  setupRepoPopover();

  var shaRegExp = /^[a-fA-F0-9]{40}$/;
  buildPopoverRepoMenu.actions = {

    addGithubRepo: function (repo, branchOrSHA) {
      var body = {
        repo: repo.attrs.full_name
      };
      if (branchOrSHA) {
        if (shaRegExp.test(branchOrSHA)) {
          body.commit = branchOrSHA;
        } else {
          body.branch = branchOrSHA;
        }
      }
      //TODO safety branch
      buildPopoverRepoMenu.data.show = false;
      data.newVersion.appCodeVersions.create(body, function (err) {
        if (err) {
          throw err;
        }
        $scope.safeApply();
      });
    },

    selectGithubRepo: function (repo) {
      repo.branches = repo.fetchBranches({}, function () {
        $scope.safeApply();
      });
    }
  };

  /**************************************
   * BuildPopoverBuildOptions
   **************************************/
  var bpbo = data.buildPopoverBuildOptions = {
    data: {},
    actions: {}
  };
  bpbo.data.environmentName = '';
  bpbo.data.buildMessage = '';
  bpbo.data.show = false;
  bpbo.data.popoverInputHasBeenClicked = false;

  function setupBuildPopover() {
    bpbo.data.project = dataBuildNew.data.project;
  }

  bpbo.actions.build = function () {
    if (bpbo.data.environmentName === '') {
      return;
    }
    var environment = dataBuildNew.data.project.environments.find(function (m) {
      return m.attrs.name === bpbo.data.environmentName;
    });
    function createEnvironment() {
      dataBuildNew.data.forkedEnvironment = dataBuildNew.data
      .project.environments.create({
        name: bpbo.data.environmentName,
      }, function (err) {
        if (err) throw err;
        dataBuildNew.actions.build();
      });
    }
    if (environment) {
      dataBuildNew.data.forkedEnvironment = environment;
      dataBuildNew.actions.build();
    } else {
      createEnvironment();
    }
  };

  bpbo.actions.getPopoverButtonText = function (name) {
    return 'Build' + ((name && name.length) ? 's in ' + name : '');
  };

  bpbo.actions.resetInputModelValue = function ($event) {
    if (!bpbo.data.popoverInputHasBeenClicked) {
      return;
    }
    bpbo.data.environmentName = '';
    bpbo.data.popoverInputHasBeenClicked = true;
  };
  /**************************************
   * // BuildPopoverBuildOptions
   **************************************/

  actions.discardChanges = function () {
    $state.go('projects.build', $stateParams);
  };

  actions.stateToBuildList = function () {
    var state = {
      userName: $stateParams.userName,
      projectName: $stateParams.projectName,
      branchName: $stateParams.branchName
    };
    $state.go('projects.buildList', state);
  };

  actions.stateToBuild = function (buildNumber) {
    var sc = angular.copy($stateParams);
    delete sc.newBuildName;
    sc.buildName = buildNumber;
    $state.go('projects.build', sc);
  };

  actions.build = function () {
    $scope.dataApp.data.loading = true;
    var buildObj = {
      message: (bpbo.data.buildMessage || 'Manual Build')
    };
    if (data.forkedEnvironment) {
      buildObj.environment = data.forkedEnvironment.id();
    }
    data.newBuild.build(buildObj, function (err, build, code) {
      $scope.dataApp.data.loading = false;
      if (err) throw err;
      actions.stateToBuild(build.buildNumber);
    });
  };

  /* ============================
   *   API Fetch Methods
   * ===========================*/

  function fetchNewBuild(cb) {
    var environment = dataBuildNew.data.environment;
    new QueryAssist(environment, cb)
      .wrapFunc('fetchBuild')
      .query($stateParams.newBuildName)
      .cacheFetch(function (build, cached, cb) {
        data.newBuild = build;
        if (typeof keypather.get(data, 'newBuild.attrs.buildNumber') === 'number') {
          return actions.stateToBuild(data.newBuild.attrs.buildNumber);
        }
        data.newVersion = build.contextVersions.models[0];
        data.newVersion.rootDir.attrs.isDir = false;
        cb();
      })
      .resolve(function (err, build, cb) {
        if (!build) {
          return cb(new Error('Build not found'));
        }
        cb(err);
      })
      .go();
  }

  function fetchOwnerRepos(cb) {
    var thisUser = $scope.dataApp.user;
    var build = data.build;
    var query;

    if (thisUser.isOwnerOf(data.project)) {
      query = new QueryAssist(thisUser, cb)
        .wrapFunc('fetchGithubRepos');
    } else {
      var githubOrg = thisUser.newGithubOrg($state.params.userName);
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
          return cb(new Error('GitHub Repos not found'));
        }
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  function newOpenItems(cb) {
    data.openItems = new OpenItems();
    var dockerfile = data.newVersion.rootDir.contents.find(function (m) {
      return m.attrs.name === 'Dockerfile';
    });
    if (dockerfile) {
      data.openItems.addOne(dockerfile);
    }
    cb();
  }

  actions.seriesFetchAll = function () {
    async.series([
      fetcherBuild($scope.dataBuildNew.data),
      fetchNewBuild,
      fetchOwnerRepos,
      newOpenItems,
    ], function (err) {
      setupBuildPopover();
      setupRepoPopover();
      if (err) {
        $state.go('404');
        throw err;
      }
      if (typeof keypather.get(data, 'newBuild.attrs.buildNumber') === 'number') {
        return actions.stateToBuild(data.newBuild.attrs.buildNumber);
      }
      $scope.safeApply();
    });
  };
  actions.seriesFetchAll();

}
