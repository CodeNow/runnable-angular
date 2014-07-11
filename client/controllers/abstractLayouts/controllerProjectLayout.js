require('app')
  .controller('ControllerProjectLayout', ControllerProjectLayout);
/**
 * ControllerProjectLayout
 * @constructor
 * @export
 * @ngInject
 */
function ControllerProjectLayout(
  $scope,
  async,
  $state,
  $stateParams,
  user
) {

  var self = ControllerProjectLayout;
  var dataProjectLayout = $scope.dataProjectLayout = self.initState();

  dataProjectLayout.getProjectBuildListHref = function (projectName) {
    return self.getProjectBuildListHref($state.params.userName, projectName);
  };
  dataProjectLayout.getInClass = function () {
    return ($state.current.name === 'projects') ? 'in' : '';
  };
  dataProjectLayout.getProjectLiClass = function (project) {
    return (project.attrs.name === $state.params.projectName) ? 'active' : '';
  };
  dataProjectLayout.stateToBuildList = function () {
    var project, environment, event;
    project = arguments[0];
    if (arguments.length == 2) {
      event = arguments[1];
    } else {
      environment = arguments[1];
      event = arguments[2];
    }
    if (event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    // speed up menu active change
    // dataProjectLayout.projectName = project.attrs.name;
    $state.go('projects.buildList', {
      userName: $scope.dataApp.user.attrs.username,
      projectName: project.attrs.name,
      branchName: ((environment) ? environment.name : 'master')
    });
  };

  dataProjectLayout.createNewApp = function () {
    dataProjectLayout.disableNewButton = true;
    async.waterfall([
      $scope.dataApp.holdUntilAuth,
      function (thisUser, cb) {
        var project = thisUser.createProject({
          name: dataProjectLayout.newAppName,
          dockerfile: 'FROM ubuntu\n'
        }, function (err) {
          cb(err, thisUser, project);
        });
      }
    ], function (err, thisUser, project) {
      dataProjectLayout.disableNewButton = false;
      if (err) {
        // TODO
      }
      $state.go('projects.setup', {
        userName: thisUser.attrs.username,
        projectName: project.attrs.name
      });
    });
  };

  $scope.$watch('dataApp.state.current.name', function () {
    initForState();
  });

  function initForState() {
    if ($state.current.name === 'projects') {
      $scope.dataApp.holdUntilAuth(angular.noop);
    } else {
      async.waterfall([
        $scope.dataApp.holdUntilAuth,
        function checkAuth(me, cb) {
          if ($scope.dataApp.user.attrs.username !== $scope.dataApp.stateParams.userName) {
            $state.go('404', {});
            return cb(new Error());
          }
          cb(null, me);
        },
        function fetchProjects(me, cb) {
          var projects = user.fetchProjects({
            ownerUsername: $scope.dataApp.stateParams.userName
          }, function (err, response) {
            if (err) {
              return cb(err);
            }
            cb(null, projects);
          });
        }
      ], function (err, projects) {
        if (err) return; // TODO error handling
        $scope.$apply(function () {
          dataProjectLayout.projects = projects;
        });
      });
    }
  }

}

ControllerProjectLayout.initState = function () {
  return {
    showChangeAccount: false,
    newAppName: '',
    disableNewButton: false
  };
};

ControllerProjectLayout.getProjectBuildListHref = function (userName, projectName) {
  return '/' + userName + '/' + projectName + '/master/';
};
