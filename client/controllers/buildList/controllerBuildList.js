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
      projectName: dataBuildList.project.attrs.name,
      branchName: dataBuildList.environment.attrs.name,
      buildName: build.attrs.id,
      instanceId: '12345'
    };
    $state.go('projects.instance', state);
  };
  actions.stateToBuild = function (build) {
    var state = {
      userName: $scope.dataApp.user.attrs.username,
      projectName: dataBuildList.project.attrs.name,
      branchName: dataBuildList.environment.attrs.name,
      buildName: build.attrs.id
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
      .cacheFetch(function updateDom(projects, cached, cb){
        dataBuildList.data.project = projects.models[0];
        cb();
      })
      .resolve(function(err, projects, cb){
        cb();
      })
      .go();

/*
    function updateDom() {
      if(projects.models.length){
      }
    }
    var projects = thisUser.fetchProjects({
      ownerUsername: $stateParams.userName,
      name: $stateParams.projectName
    }, function (err, body) {
      if (err) {
        // project not found
        $state.go('404', {});
        return cb(err);
      }
      // data.project = projects.models[0];
      updateDom();
      cb(null, projects.models[0]);
    });
    if (projects.models.length) {
      dataBuildList.project = projects.models[0];
      $scope.safeApply();
      cb(null, dataBuildList.project);
      cb = angular.noop;
    }
*/
  }
  function fetchEnvironments(project, cb) {
    var environments = project.fetchEnvironments({
      ownerUsername: $stateParams.userName,
      name: $stateParams.branchName // <-- should be environmentName
    }, function (err) {
      if (err) {
        // no environments found
        return cb(err);
      }
      dataBuildList.environment = environments.models[0];
      cb(null, project, environments, environments.models[0]);
    });
    if (environments.models.length) {
      dataBuildList.environments = environments;
      dataBuildList.environment = environments.models[0];
      $scope.safeApply();
      cb(null, project, environments, dataBuildList.environment);
      cb = angular.noop;
    }
  }
  function fetchBuilds(project, environments, environment, cb) {
    var builds = environment.fetchBuilds(function (err) {
      if (err) {
        return cb(err);
      }
      dataBuildList.builds = builds;
      cb(null, project, environments, environment, builds);
    });
    dataBuildList.builds = builds;
    $scope.safeApply();
  }
  function fetchBuildsOwners(project, environments, environment, builds, cb) {
    //TODO FIX
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
      cb(null, project, environments, environment, builds, buildOwners);
    });
    dataBuildList.buildOwners = buildOwners;
    $scope.safeApply();
  }
  actions.initState = function () {
    async.waterfall([
      $scope.dataApp.holdUntilAuth,
      fetchProject,
      fetchEnvironments,
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
