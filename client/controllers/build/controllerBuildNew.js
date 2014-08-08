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
  hasProps
) {
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var dataBuildNew = $scope.dataBuildNew =  {};
  var actions = dataBuildNew.actions = {};
  var data = dataBuildNew.data = {
    showBuildMenu: false,
    newBuildName: '?',
    showExplorer: true
  };

  data.popoverBuildOptions = {
    actions: {},
    data: {}
  };
  var pbo = data.popoverBuildOptions;
  pbo.data.show = false;

  /**************************************
   * DataTreeFilePopoverRepoItemMenu
   **************************************/
  data.dataFileTreePopoverRepoItemMenu = {};
  var repoCMData = data.dataFileTreePopoverRepoItemMenu.data = {};
  var repoCMActions = data.dataFileTreePopoverRepoItemMenu.actions = {};
  repoCMData.show = false;

  /**************************************
   * BuildPopoverBuildOptions
   **************************************/
  var buildPopoverRepoMenu = data.buildPopoverRepoMenu = {};

  function setupRepoPopover () {
    buildPopoverRepoMenu.data = {
      show: false,
      appCodeVersions : keypather.get(data, 'newVersion.appCodeVersions')
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
        }
        else {
          body.branch = branchOrSHA;
        }
      }
      data.newVersion.appCodeVersions.create(body, function (err) {
        if (err) {
          throw err;
        }
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
  bpbo.data.buildName = '';
  bpbo.data.buildMessage = '';
  bpbo.data.show = false;
  bpbo.data.popoverInputHasBeenClicked = false;

  function setupBuildPopover () {
    bpbo.data.project = data.project;
  }

  bpbo.actions.build = function () {
    var project = dataBuildNew.data.project;
    var env = project.environments.find(hasProps({
      lowerName: bpbo.data.buildName
    }));
    if (!env) {
      var body = {
        name: bpbo.data.buildName
      };
      env = project.createEnvironment(body, done);
    } else {
      done();
    }
    function done (err) {
      if (err) {
        throw err;
      }
      var newBuild = dataBuildNew.data.newBuild;
      newBuild.build({
        message: bpbo.data.buildMessage,
        environment: env.id()
      }, function (err) {
        if (err) {
          throw err;
        }
        var sc = angular.copy($stateParams);
        sc.branchName = env.attrs.name;
        sc.buildName = newBuild.attrs.buildNumber;
        delete sc.newBuildName;
        $state.go('projects.build', sc);
      });
    }
  };

  bpbo.actions.getPopoverButtonText = function (name) {
    return 'Build' + ((name && name.length) ? 's in ' + name : '');
  };

  bpbo.actions.resetInputModelValue = function ($event) {
    if (!bpbo.data.popoverInputHasBeenClicked) { return; }
    bpbo.data.buildName = '';
    bpbo.data.popoverInputHasBeenClicked = true;
  };
  /**************************************
   * // BuildPopoverBuildOptions
   **************************************/

  actions.discardChanges = function () {
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
    var buildData = data.buildPopoverBuildOptionsData;
    data.newBuild.build({
      message: 'Manual Build'
    }, function (err, build, code) {
      if (err) {
        throw err;
      }
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

  function fetchOwnerRepos (cb) {
    var thisUser = $scope.dataApp.user;
    var build = data.build;
    var query;

    if (thisUser.isOwnerOf(data.project)) {
      query = new QueryAssist(thisUser, cb)
        .wrapFunc('fetchGithubRepos');
    }
    else {
      var githubOrg = thisUser.newGithubOrg(build.attrs.owner.username);
      query = new QueryAssist(githubOrg, cb)
        .wrapFunc('fetchRepos');
    }
    query
      .query({})
      .cacheFetch(function updateDom(githubRepos, cached, cb){
        data.githubRepos = githubRepos;
        buildPopoverRepoMenu.data.githubRepos = githubRepos;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, githubRepos, cb){
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
  }

  actions.seriesFetchAll = function () {
    async.series([
      fetcherBuild($scope.dataBuildNew.data),
      fetchNewBuild,
      fetchOwnerRepos,
      newOpenItems,
    ], function(err){
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
