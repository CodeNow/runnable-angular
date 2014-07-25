require('app')
  .controller('ControllerBuildList', ControllerBuildList);
/**
 * ControllerBuildList
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerBuildList(
  $scope,
  $window,
  user,
  $stateParams,
  $state,
  async,
  keypather,
  hasKeypaths
) {

  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var self = ControllerBuildList;
  var dataBuildList = $scope.dataBuildList = self.initState();
  var data = dataBuildList.data;
  var actions = dataBuildList.actions;

  // scope event listeners
  $scope.$on('app-document-click', function () {
    data.showChangeRecipe = false;
    data.popoverChangeRecipe.filter = '';
  });

  $scope.$watch('dataBuildList.data.project.attrs.name', function (newval, oldval) {
    if (typeof oldval !== 'string') {
      return;
    }
    dataBuildList.data.project.update({
      name: newval
    }, function () {
      $stateParams.projectName = newval;

      /* Fks a lot of sht up
      $window.history.replaceState({}, '', '/project/'+
                                            $stateParams.userName+'/'+
                                            newval+'/'+
                                            $stateParams.branchName+'/');
      */

    });
  });

  actions.stateToInstance = function (buildId) {
    var state = {
      userName: $scope.dataApp.user.attrs.accounts.github.username,
      projectName: data.project.attrs.name,
      branchName: data.environment.attrs.name,
      buildName: build.attrs.id,
      instanceId: '12345'
    };
    $state.go('projects.instance', state);
  };
  actions.stateToBuild = function (build) {
    var state = {
      userName: $scope.dataApp.user.attrs.accounts.github.username,
      projectName: data.project.attrs.name,
      branchName: data.environment.attrs.name,
      buildName: build.id()
    };
    $state.go('projects.build', state);
  };
  actions.toggleSortByBuild = function () {
    dataBuildList.predicate = 'attrs.id';
    dataBuildList.ascending = !dataBuildList.ascending;
  };
  actions.getBuildSortClass = function () {
    var res = (dataBuildList.predicate === 'attrs.id' && dataBuildList.ascending) ?
      'ascending' : (dataBuildList.predicate === 'attrs.id' && !dataBuildList.ascending) ?
      'descending' : '';
    return res;
  };
  actions.stateToSetupFirstBuild = function () {
    $state.go('projects.setup', {
      userName: $scope.dataApp.stateParams.userName,
      projectName: $scope.dataApp.stateParams.projectName
    });
  };

  /* ============================
   *   API Fetch Methods
   * ===========================*/
  function fetchProject (cb) {
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchProjects')
      .query({
        ownerUsername: $stateParams.userName,
        name: $stateParams.projectName
      })
      .cacheFetch(function updateDom(projects, cached, cb) {
        var project = projects.models[0];
        if (!project) {
          // project not found redirect..
        }
        else {
          data.project = project;
          var env = project.environments.find(hasKeypaths({
            'attrs.name.toLowerCase()': $stateParams.branchName
          }));
          if (!env) {
            // environment not found redirect..
          }
          else {
            data.environment = env;
          }
          cb();
        }
      })
      .resolve(function (err, projects, cb) {
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  function fetchBuilds (cb) {
    new QueryAssist(data.environment, cb)
      .wrapFunc('fetchBuilds')
      .query({ started: true })
      .cacheFetch(function updateDom(builds, cached, cb) {
        if (builds.models.length === 0) {
          // redirect to create new build page
        }
        else if (builds.models.length === 1 && !builds.models[0].attrs.started) {
          actions.stateToSetupFirstBuild();
        }
        else {
          data.builds = builds;
          $scope.safeApply();
          cb();
        }
      })
      .resolve(function (err) {
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  actions.initState = function () {
    async.waterfall([
      holdUntilAuth,
      fetchProject,
      fetchBuilds
    ], function (err, project, environments, environment, builds) {
      if (err) {
        // TODO error handling
        throw err;
      }
      $scope.safeApply();
    });
  };
  actions.initState();
}

ControllerBuildList.initState = function () {
  return {
    data: {
      popoverChangeRecipe: {
        recipe: ''
      },
      showChangeRecipe: false,
      predicate: '',
      ascending: false
    },
    actions: {}
  };
};

ControllerBuildList.initPopoverState = function () {
  return {};
};
