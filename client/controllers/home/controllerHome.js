require('app')
  .controller('ControllerHome', ControllerHome);
var injAsync;
/**
 * ControllerHome
 * @constructor
 * @export
 * @ngInject
 */
function ControllerHome (
  $scope,
  apiHost,
  user,
  async
) {

  injAsync = async;
  var self = ControllerHome;
  var dataHome = $scope.dataHome = self.initState(apiHost);
  self.checkIfAuth(
    $scope.dataApp.holdUntilAuth,
    $scope.dataApp.state,
    user
  );
}

ControllerHome.initState = function (apiHost) {
  return {
    apiHost: apiHost,
    authUrl: apiHost+'/auth/github?redirect='+encodeURI('http://localhost:3001/')
  };
};

ControllerHome.checkIfAuth = function (holdUntilAuth,
                                       $state,
                                       user) {
  holdUntilAuth(function (err, thisUser) {
    if (!err && thisUser) {
      var projects = thisUser.fetchProjects({
        ownerUsername: thisUser.attrs.username
      }, function () {
        if (!projects.models.length) {
          return;
        }
        var firstProject = projects.models[0];
        $state.go('projects.buildList', {
          userName:    thisUser.attrs.username,
          projectName: firstProject.attrs.name,
          branchName:  'master'
        });
      });
    }
  });
};

// temporary helper
ControllerHome.seed = function () {

};
