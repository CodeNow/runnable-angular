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
  $window,
  hasKeypaths
) {

  // init data
  var dataBuildList = $scope.dataBuildList = {};
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
    event.stopPropagation();
    dataBuildList['show' + popoverName] = true;
  };
  dataBuildList.getBuildHref = function (buildId) {
    return '/' + $stateParams.userName + '/' + $stateParams.projectName + '/' + $stateParams.branchName + '/' + buildId + '/';
  };
  dataBuildList.redirectInstancePage = function (buildId) {
    $state.go('projects.instance', angular.extend({
      buildId:    buildId,
      instanceId: '555'
    }, $stateParams));
  };
  dataBuildList.redirectBuildPage = function (buildId) {
    $state.go('projects.build', angular.extend({
      buildId: buildId
    }, $stateParams));
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

    function fetchProject (me, cb) {
      var projects = user.fetchProjects({
        ownerUsername: $stateParams.userName,
        name:          $stateParams.projectName
      }, function (err, body) {
        if (err) {
          // project not found
          $state.go('404', {});
          return cb(err);
        }
        cb(null, projects.models[0]);
      });
    },
    function fetchEnvironments (project, cb) {
      var environments = project.fetchEnvironments({
        ownerUsername: $stateParams.userName
      }, function (err) {
        if (err) {
          // no environments found
          return cb(err);
        }
        cb(null, project, environments);
      });
    },
    function fetchEnvironment (project, environments, cb) {
      var environment = environments.models.filter(hasKeypaths({'attrs.name': 'master'}))[0];
      cb(null, project, environments, environment);
    },
    function fetchBuilds (project, environments, environment, cb) {
      var builds = environment.fetchBuilds(function (err) {
        if (err) {
          return cb(err);
        }
        cb(null, project, environments, environment, builds);
      });
    },
    function fetchBuildsOwners (project, environments, environment, builds, cb) {
      if (builds.models.length === 0) {
        return cb(null, project, environments, environment, [], []);
      }
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
        buildOwners = buildOwners.models.reduce(function (previous, current) {
          previous[current.id()] = current;
          return previous;
        }, {});
        cb(null, project, environments, environment, builds, buildOwners);
      });
    }
  ], function (err, project, environments, environment, builds, buildOwners) {
    if (err) return; // TODO error handling
    $scope.$apply(function () {
      dataBuildList.project      = project;
      dataBuildList.environments = environments;
      dataBuildList.environment  = environment;
      dataBuildList.builds       = builds;
      dataBuildList.buildOwners  = buildOwners;
    });
  });
}
