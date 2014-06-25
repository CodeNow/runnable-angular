var app  = require('app');
app.controller('ControllerProjectLayout', ControllerProjectLayout);
/**
 * ControllerProjectLayout
 * @constructor
 * @export
 * @ngInject
 */
function ControllerProjectLayout ($scope,
                                  async,
                                  user) {
  var dataProjectLayout = $scope.dataProjectLayout = {};
  dataProjectLayout.name = $scope.dataApp.state.params.name;
  dataProjectLayout.getProjectBuildListUrl = function (name) {
    return '/' + $scope.dataApp.state.params.ownerUsername + '/' + name + '/master/';
  };

  async.waterfall([
    // temporary helper
    function tempHelper (cb) {
      if (user.id()) {
        cb();
      } else {
        //user.anonymous(function () { cb(); });
        user.login('runnableUser9', 'asdfasdf9', function () { cb(); });
      }
    },
    //-------
    function fetchProjects (cb) {
      var projects = user.fetchProjects({ownerUsername: 'runnableUser9'}, function (err, body) {
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