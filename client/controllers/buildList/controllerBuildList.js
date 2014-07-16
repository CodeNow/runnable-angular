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
  user,
  $stateParams,
  $state,
  async,
  keypather
) {
  var QueryAssist = $scope.UTIL.QueryAssist;
  var self = ControllerBuildList;
  var dataBuildList = $scope.dataBuildList = self.initState();
  var data = dataBuildList.data,
    actions = dataBuildList.actions;

  // scope event listeners
  $scope.$on('app-document-click', function () {
    dataBuildList.data.showChangeRecipe = false;
    dataBuildList.data.popoverChangeRecipe.filter = '';
  });

  actions.stateToInstance = function (buildId) {
    var state = {
      userName: $scope.dataApp.user.attrs.username,
      projectName: dataBuildList.data.project.attrs.name,
      branchName: dataBuildList.data.environment.attrs.name,
      buildName: build.attrs.id,
      instanceId: '12345'
    };
    $state.go('projects.instance', state);
  };
  actions.stateToBuild = function (build) {
    var state = {
      userName: $scope.dataApp.user.attrs.username,
      projectName: dataBuildList.data.project.attrs.name,
      branchName: dataBuildList.data.environment.attrs.name,
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

  /* ============================
   *   API Fetch Methods
   * ===========================*/
  function fetchProject(thisUser, cb) {
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchProjects')
      .query({
        ownerUsername: $stateParams.userName,
        name: $stateParams.projectName
      })
      .cacheFetch(function updateDom(projects, cached, cb) {
        dataBuildList.data.project = projects.models[0];
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
    new QueryAssist(dataBuildList.data.project, cb)
      .wrapFunc('fetchEnvironments')
      .query({
        ownerUsername: $stateParams.userName,
        name: $stateParams.branchName
      })
      .cacheFetch(function updateDom(environments, cached, cb) {
        dataBuildList.data.environment = environments.models[0];
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, environments, cb) {
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function fetchBuilds(cb) {
    new QueryAssist(dataBuildList.data.environment, cb)
      .wrapFunc('fetchBuilds')
      .cacheFetch(function updateDom(builds, cached, cb) {
        dataBuildList.data.builds = builds;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err) {
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function fetchBuildsOwners(cb) {
    //TODO FIX
    /*
    var builds = dataBuildList.data.builds;
    var ownerIds = builds.models
      .map(function (item) {
        return item.attrs.owner.github;
      })
      .reduce(function (previous, current) {
        if (previous.indexOf(current) === -1) previous.push(current);
        return previous;
      }, []);
    var buildOwners = user.fetchUsers({
      _id: ownerIds
    }, function (err) {
      if (err) {
        return;
      }
      dataBuildList.buildOwners = buildOwners;
      cb();
    });
    dataBuildList.buildOwners = buildOwners;
    $scope.safeApply();
    */
    cb();
  }
  actions.initState = function () {
    async.waterfall([
      $scope.dataApp.holdUntilAuth,
      fetchProject,
      fetchEnvironment,
      fetchBuilds,
      fetchBuildsOwners
    ], function (err, project, environments, environment, builds, buildOwners) {
      if (err) return;
      // TODO error handling
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
