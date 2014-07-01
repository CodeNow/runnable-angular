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
  user
) {

  var self = ControllerProjectLayout;
  var dataProjectLayout = $scope.dataProjectLayout = self.initState();

  dataProjectLayout.getProjectBuildListHref = function (projectName) {
    return '/' + $scope.dataApp.stateParams.userName + '/' + projectName + '/master/';
  };

  async.waterfall([
    $scope.dataApp.holdUntilAuth,

    function fetchProjects (me, cb) {
      var projects = user.fetchProjects({
        ownerUsername: $scope.dataApp.stateParams.userName
      }, function (err, body) {
        if (err) {
          // error handling
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

ControllerProjectLayout.initState = function () {
  return {
    showChangeAccount: false
  };
};
