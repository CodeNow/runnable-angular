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
  SharedFilesCollection,
  keypather,
  fetcherBuild
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
      githubRepos : data.githubRepos,
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
  data.buildPopoverBuildOptionsData = {
    buildName: '',
    showBuildMenu: false,
    popoverInputHasBeenClicked: false
  };

  actions.getPopoverButtonText = function (name) {
    return 'Build' + ((name && name.length) ? 's in ' + name : '');
  };

  actions.resetInputModelValue = function ($event) {
    if (!dataBuildNew.data.popoverInputHasBeenClicked) { return; }
    data.buildPopoverBuildOptionsData.buildName = '';
    data.buildPopoverBuildOptionsData.popoverInputHasBeenClicked = true;
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
      message: buildData.buildName
      // config: buildData.buildConfig ??
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

  function newFilesCollOpenFiles(cb) {
    //var version = dataBuildNew.data.version;
    var version = dataBuildNew.data.newBuild.contextVersions.models[0];
    data.newVersion = version;
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
      fetcherBuild($scope.dataBuildNew.data),
      fetchNewBuild,
      fetchOwnerRepos,
      newFilesCollOpenFiles,
    ], function(){
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
