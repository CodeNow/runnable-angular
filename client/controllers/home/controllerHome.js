require('app')
  .controller('ControllerHome', ControllerHome);
/**
 * ControllerHome
 * @constructor
 * @export
 * @ngInject
 */
function ControllerHome (
  $scope,
  user
) {
  var self = ControllerHome;
  var dataHome = $scope.dataHome = self.initState();
  self.checkIfAuth(
    $scope.dataApp.holdUntilAuth,
    $scope.dataApp.state,
    user
  );
}

ControllerHome.initState = function () {
  return {
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
          $state.go('projects', {});
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
