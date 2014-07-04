require('app')
  .controller('ControllerBuildList', ControllerBuildList);
/**
 * ControllerBuildList
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerBuildList (
  $scope,
  user,
  $stateParams,
  $state,
  async,
  keypather
) {
  // init data
  var self = ControllerBuildList;
  var dataBuildList = $scope.dataBuildList = {}; // self.initState();

  dataBuildList.popoverChangeRecipe = {
    filter: ''
  };

  dataBuildList.showChangeRecipe = false;
  dataBuildList.predicate = '';
  dataBuildList.ascending = false;



  // scope event listeners
  $scope.$on('app-document-click', function () {
    dataBuildList.showChangeRecipe = false;
    dataBuildList.popoverChangeRecipe.filter = '';
  });

  // dom event callbacks
  dataBuildList.show404 = function () {
    $state.go('error', {}, {
      location: false,
      inherit:  true
    });
  };
  dataBuildList.togglePopover = function (popoverName, event) {
    if (angular.isFunction(keypather.get(event, 'stopPropagation'))) {
      event.stopPropagation();
    }
    dataBuildList['show' + popoverName] = true;
  };
  dataBuildList.getBuildHref = function (buildId) {
    return '/' + $stateParams.userName + '/' + $stateParams.projectName + '/' + $stateParams.branchName + '/' + buildId + '/';
  };
  dataBuildList.stateToInstance= function (buildId) {
    var state = {
      userName:    $scope.dataApp.user.attrs.username,
      projectName: dataBuildList.project.attrs.name,
      branchName:  dataBuildList.environment.attrs.name,
      buildName:   build.attrs.id,
      instanceId:  '12345'
    };
    $state.go('projects.instance', state);
  };
  dataBuildList.stateToBuild = function (build) {
    var state = {
      userName:    $scope.dataApp.user.attrs.username,
      projectName: dataBuildList.project.attrs.name,
      branchName:  dataBuildList.environment.attrs.name,
      buildName:   build.attrs.id
    };
    $state.go('projects.build', state);
  };
  dataBuildList.toggleSortByBuild = function () {
    dataBuildList.predicate = 'attrs.id';
    dataBuildList.ascending = !dataBuildList.ascending;
  };
  dataBuildList.getBuildSortClass = function () {
    var res = (dataBuildList.predicate === 'attrs.id' && dataBuildList.ascending) ?
      'ascending' : (dataBuildList.predicate === 'attrs.id' && !dataBuildList.ascending) ?
        'descending' : '';
    return res;
  };

  // seed data
  async.waterfall([
    $scope.dataApp.holdUntilAuth,
    function fetchProject (thisUser, cb) {
      var projects = thisUser.fetchProjects({
        ownerUsername: $stateParams.userName,
        name:          $stateParams.projectName
      }, function (err, body) {
        if (err) {
          // project not found
          $state.go('404', {});
          return cb(err);
        }
        dataBuildList.project = projects.models[0];
        cb(null, projects.models[0]);
      });
      if (projects.models.length) {
        dataBuildList.project = projects.models[0];
        $scope.safeApply();
        cb(null, dataBuildList.project);
        cb = angular.noop;
      }
    },
    function fetchEnvironments (project, cb) {
      var environments = project.fetchEnvironments({
        ownerUsername: $stateParams.userName,
        name:          $stateParams.branchName // <-- should be environmentName
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
    },
    function fetchBuilds (project, environments, environment, cb) {
      var builds = environment.fetchBuilds(function (err) {
        if (err) {
          return cb(err);
        }
        dataBuildList.builds = builds;
        cb(null, project, environments, environment, builds);
      });
      dataBuildList.builds = builds;
      $scope.safeApply();
    },
    function fetchBuildsOwners (project, environments, environment, builds, cb) {
      var ownerIds = builds.models
        .map(function (item) {
          return item.attrs.owner;
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
  ], function (err, project, environments, environment, builds, buildOwners) {
    if (err) return; // TODO error handling
    $scope.$apply();
  });
}

ControllerBuildList.initState = function () {
  return {
    popoverChangeRecipe: {
      recipe: ''
    },
    showChangeRecipe: false,
    predicate: '',
    ascending: false
  };
};
