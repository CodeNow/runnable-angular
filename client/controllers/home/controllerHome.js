require('app')
  .controller('ControllerHome', ControllerHome);
/**
 * ControllerHome
 * @constructor
 * @export
 * @ngInject
 */
function ControllerHome(
  $scope,
  $state,
  async
) {
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var QueryAssist = $scope.UTIL.QueryAssist;
  var self = ControllerHome;
  var dataHome = $scope.dataHome = self.initState();

  function verifyUserIsAuth() {
    async.series([
      holdUntilAuth,
      fetchProjects,
      function sendUserSomewhere(cb) {
        var thisUser = $scope.dataApp.user;
        var projects = dataHome.data.projects;
        if (!projects.models.length) {
          // new project
          $state.go('projects', {});
          return cb();
        }
        var firstProject = projects.models[0];
        $state.go('projects.buildList', {
          userName: thisUser.attrs.accounts.github.username,
          projectName: firstProject.attrs.name,
          branchName: 'master'
        });
        cb();
      }
    ]);
  }

  function fetchProjects(cb) {
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchProjects')
      .query({
        githubUsername: thisUser.attrs.accounts.github.username
      })
      .cacheFetch(function (projects, cached, cb) {
        dataHome.data.projects = projects;
        cb();
      })
      .resolve(function (err, projects, cb) {
        cb();
      })
      .go();
  }

  verifyUserIsAuth();
}

ControllerHome.initState = function () {
  return {
    actions: {},
    data: {}
  };
};
