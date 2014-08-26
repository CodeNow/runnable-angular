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
  async,
  $localStorage,
  keypather
) {
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var QueryAssist = $scope.UTIL.QueryAssist;
  var self = ControllerHome;
  var dataHome = $scope.dataHome = self.initState();

  verifyUserIsAuth();

  function verifyUserIsAuth() {
    async.series([
      holdUntilAuth,
      fetchProjects,
      function sendUserSomewhere(cb) {

        var thisUser = $scope.dataApp.user;

        if (!keypather.get($localStorage, 'stateParams.projectName')) {
          // no cached previously visited project
          goToFirstProject();
        } else {
          goToLastVisitedProject();
        }

        clean();
        return cb();

        function getEntityName(userOrOrg) {
          return (thisUser === userOrOrg) ?
            thisUser.attrs.accounts.github.username : // user
            userOrOrg.attrs.login;                    // org
        }

        // remove attached projects property from user/org models
        function clean() {
          dataHome.data.orgs.forEach(function (org) {
            delete org.projects;
          });
        }

        function goToFirstProject() {
          if (thisUser.projects.length === 0) {
            return goToSetup();
          }
          var firstProject = thisUser.projects.models[0];
          var userName = thisUser.attrs.accounts.github.username;
          var projectName = firstProject.attrs.name;
          $state.go('projects.buildList', {
            userName: userName,
            projectName: projectName,
            branchName: 'master'
          });
        }

        function goToSetup() {
          $state.go('projects', {});
          return cb();
        }

        function goToLastVisitedProject() {
          var projectName = $localStorage.stateParams.projectName;
          var userOrgName = $localStorage.stateParams.userName;
          var branchName = $localStorage.stateParams.branchName;
          //verify exists
          var org = dataHome.data.orgs.find(function (org) {
            return getEntityName(org) === userOrgName;
          });
          if(!org) {
            return goToFirstProject();
          }
          var project = org.projects.find(function (project) {
            return project.attrs.name === projectName;
          });
          if(!project) {
            return goToFirstProject();
          }
          // we found the cached org & project
          $state.go('projects.buildList', {
            userName: userOrgName,
            projectName: projectName,
            branchName: branchName
          });
        }
      }
    ]);
  }

  /**
   * Fetch all user orgs and all projects for user + user-orgs
   * temporarily attach 'projects' property to user & org models
   */
  function fetchProjects(cb) {
    var thisUser = $scope.dataApp.user;

    if (!keypather.get($localStorage, 'stateParams.projectName')) {
      // dont bother finding all orgs, we're just going to send user to first user-project
      dataHome.data.orgs = [thisUser];
      fetchAllProjects(dataHome.data.orgs);
    } else {
      var orgs = thisUser.fetchGithubOrgs(function (err) {
        if (err) throw err;
        dataHome.data.orgs = orgs.models;
        dataHome.data.orgs.unshift(thisUser);
        fetchAllProjects(dataHome.data.orgs);
      });
    }

    function fetchAllProjects(orgs) {
      async.map(orgs, fetchProjectsForOrg, function (err, projects) {
        if (err) throw err;
        cb();
      });
    }

    function fetchProjectsForOrg(userOrOrg, cb) {
      var userName = (thisUser === userOrOrg) ?
        thisUser.attrs.accounts.github.username : // user
        userOrOrg.attrs.login;                    // org

      new QueryAssist(thisUser, cb)
        .wrapFunc('fetchProjects')
        .query({
          githubUsername: userName
        })
        .cacheFetch(function (projects, cached, cb) {
        })
        .resolve(function (userOrOrg, err, projects, cb) {
          userOrOrg.projects = projects;
          cb(null, projects);
        }.bind(this, userOrOrg))
        .go();
    }

  }

}

ControllerHome.initState = function () {
  return {
    actions: {},
    data: {}
  };
};
