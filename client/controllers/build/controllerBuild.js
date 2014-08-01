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
        build: data.build.id()
      }
    }, function (err) {
      if (err) { throw err; }
      var state = {
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
    var newBuild = data.build.rebuild(
      function (err, build) {
        if (err) {
          throw err;
        }
        $state.go('projects.build', angular.copy({
          buildName: newBuild.attrs.buildNumber
        }, $stateParams));
      });
  }

  actions.rebuild = function () {
    runBuild();
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
      .resolve(function (err, githubRepos, cb) {
        if (!githubRepos) {
          return cb(new Error('GitHub repos not found'));
        }
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  function newOpenItemsCollection(cb) {
    data.openItems = new OpenItems({noStore: true});
  }

  actions.seriesFetchAll = function () {
    async.series([
      fetcherBuild($scope.dataBuild.data),
      fetchOwnerRepos,
      newOpenItemsCollection
    ], function (err) {
      if (err) {
        $state.go('404');
        throw err;
      }
    });
  };
  actions.seriesFetchAll();

}
