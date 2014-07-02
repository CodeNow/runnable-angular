require('app')
  .controller('ControllerProjectLayout', ControllerProjectLayout);
/**
 * ControllerProjectLayout
 * @constructor
 * @export
 * @ngInject
 */
function ControllerProjectLayout (
  $scope,
  async,
  $state,
  user
) {
  var self = ControllerProjectLayout;
  var dataProjectLayout = $scope.dataProjectLayout = self.initState();

  dataProjectLayout.getProjectBuildListHref = function (projectName) {
    return self.getProjectBuildListHref($scope.dataApp.stateParams.userName, projectName);
  };
  dataProjectLayout.getInClass = function () {
    return ($state.current.name === 'projects') ? 'in' : '';
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

  function initForState () {
    if ($state.current.name === 'projects') {
      $scope.dataApp.holdUntilAuth(angular.noop);
    } else {
      async.waterfall([
        $scope.dataApp.holdUntilAuth,
        function checkAuth (me, cb) {
          if ($scope.dataApp.user.attrs.username !== $scope.dataApp.stateParams.userName) {
            $state.go('404', {});
            return cb(new Error());
          }
          cb(null, me);
        },
        function fetchProjects (me, cb) {
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
