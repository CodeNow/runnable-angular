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

  var dataProjectLayout = $scope.dataProjectLayout = {};
  dataProjectLayout.getProjectBuildListHref = function (projectName) {
    return '/' + $scope.dataApp.stateParams.userName + '/' + projectName + '/master/';
  };

  async.waterfall([
    // temporary helper
    $scope.dataApp.holdUntilAuth,
/*    function tempHelper (cb) {*/
      //if (user.id()) {
        //cb();
      //} else {
        ////user.anonymous(function () { cb(); });
        //user.login('runnableUser9', 'asdfasdf9', function () { cb(); });
      //}
/*    }*/
    //-------
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
