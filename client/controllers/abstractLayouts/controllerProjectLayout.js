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
  user,
  keypather
) {
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var self = ControllerProjectLayout;
  var dataProjectLayout = $scope.dataProjectLayout = self.initState();
  var data = dataProjectLayout.data,
    actions = dataProjectLayout.actions;

  function isUser(entity) {
    return entity === $scope.dataApp.user;
  }
  actions.getEntityName = function (entity) {
    if (entity) {
      return isUser(entity) ?
        entity.attrs.accounts.github.username : // user
        entity.login; // org
    }
  };
  actions.getEntityGravatar = function (entity) {
    if (entity) {
      return isUser(entity) ?
        entity.attrs.gravatar : // user
        entity.avatar_url; // org
    }
  };
  actions.selectProjectOwner = function (userOrOrg) {
    dataProjectLayout.data.newProjectOwner = userOrOrg;
    dataProjectLayout.data.showChangeAccount = false;
    $scope.safeApply();
  };
  actions.getInClass = function () {
    return ($state.current.name === 'projects') ? 'in' : '';
  };
  actions.getProjectBuildListHref = function (projectName) {
    return '/' + $state.params.userName + '/' + projectName + '/master/';
  };
  actions.getProjectLiClass = function (project) {
    return (project.attrs.name === $state.params.projectName) ? 'active' : '';
  };
  actions.createNewProject = function () {
    var thisUser = $scope.dataApp.user;
    function createProject(cb) {
      var body = {
        name: dataProjectLayout.data.newProjectName
      };
      var owner = dataProjectLayout.data.newProjectOwner;
      if (owner !== $scope.dataApp.user) { // org owner selected
        body.owner = {
          github: owner.id
        };
      }
      var project = thisUser.createProject(body, function (err) {
        if (err) {
          throw err;
        }
        cb(err, thisUser, project);
      });
    }
    function createBuild(thisUser, project, cb) {
      var environment = project.environments.models[0];
      var build = environment.createBuild({
        environment: environment.id()
      }, function (err) {
        cb(null, thisUser, project, build);
      });
    }
    async.waterfall([
      holdUntilAuth,
      createProject,
      createBuild
    ], function (err, thisUser, project, build) {
      $state.go('projects.setup', {
        userName: thisUser.attrs.accounts.github.username,
        projectName: project.attrs.name
      });
    });
  };
  actions.stateToBuildList = function () {
    var project, environment, event;
    project = arguments[0];
    if (arguments.length == 2) { // project, $event
      event = arguments[1];
    } else { // project, environment, $event
      environment = arguments[1];
      event = arguments[2];
    }
    if (angular.isFunction(keypather.get(event, 'stopPropagation'))) {
      event.stopPropagation();
    }
    $state.go('projects.buildList', {
      userName: $scope.dataApp.user.attrs.accounts.github.username,
      projectName: project.attrs.name,
      branchName: ((environment) ? environment.name : 'master')
    });
  };

  /* ============================
   *   API Fetch Methods
   * ===========================*/
  function fetchOrgs(cb) {
    var thisUser = $scope.dataApp.user;
    thisUser.fetchGithubOrgs(function (err, orgs) {
      dataProjectLayout.data.orgs = orgs;
      actions.selectProjectOwner(thisUser);
      $scope.safeApply();
      cb();
    });
  }
  function fetchProjects(cb) {
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchProjects')
      .query({
        githubUsername: $scope.dataApp.stateParams.userName
      })
      .cacheFetch(function updateDom(projects, cached, cb) {
        dataProjectLayout.data.projects = projects;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, projects, cb) {
        $scope.safeApply();
        cb();
      })
      .go();
  }
  /**
   * All pages besides new project page
   */
  actions.initForState = function () {
    async.waterfall([
      holdUntilAuth,
      fetchOrgs,
      fetchProjects
    ]);
  };
  /**
   * New project page
   */
  actions.initForNewState = function () {
    async.waterfall([
      holdUntilAuth,
      fetchOrgs
    ]);
  };

  $scope.$watch('dataApp.state.current.name', function (newval, oldval) {
    if (newval.indexOf('projects.') === 0) {
      actions.initForState();
    } else if (newval === 'projects') {
      actions.initForNewState();
    }
  });
}

ControllerProjectLayout.initState = function () {
  return {
    data: {
      showChangeAccount: false,
      newProjectName: ''
    },
    actions: {}
  };
};
