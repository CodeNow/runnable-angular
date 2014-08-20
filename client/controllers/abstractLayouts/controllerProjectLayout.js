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
  keypather,
  callbackCount,
  hasKeypaths
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
        entity.attrs.login; // org
    }
  };

  actions.getEntityId = function (entity) {
    if (entity) {
      return isUser(entity) ?
        entity.attrs.accounts.github.id : //user
        entity.attrs.id; //org
    }
  };

  actions.getEntityGravatar = function (entity) {
    if (entity) {
      return isUser(entity) ?
        entity.attrs.gravatar : // user
        entity.attrs.avatar_url; // org
    }
  };

  actions.checkName = function () {
    if (!dataProjectLayout.data.projects) {
      return;
    }
    var match = dataProjectLayout.data.projects.find(function (m) {
      return (m.attrs.name === dataProjectLayout.data.newProjectName);
    });
    dataProjectLayout.data.newNameTaken = !!match;
  };

  actions.selectProjectOwner = function (userOrOrg, cb) {
    var name = actions.getEntityName(userOrOrg);
    data.activeAccount = userOrOrg;
    data.showChangeAccount = false;
    data.instances = null;

    if (cb) {
      return cb();
    }

    fetchInstances(function (err) {
      if (err) {
        return $state.go('404');
      }
      if (name === $state.params.userName || $scope.dataApp.state.current.name === 'projects') {
        // First fetch for the page or we're on /new
        return;
      }
      if (!data.activeAccount.attrs.projects.models.length) {
        // new project
        return $state.go('projects', {});
      }
      data.activeProject = data.activeAccount.attrs.projects.models[0];
      $state.go('projects.buildList', {
        userName: name,
        projectName: data.activeProject.attrs.name,
        branchName: 'master'
      });
    });
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
    if (dataProjectLayout.data.newProjectNameForm.$invalid) {
      return;
    }
    var thisUser = $scope.dataApp.user;
    data.creatingProject = true;

    function createProject(cb) {
      var body = {
        name: dataProjectLayout.data.newProjectName
      };
      var owner = data.activeAccount;
      if (owner !== $scope.dataApp.user) { // org owner selected
        body.owner = {
          github: actions.getEntityId(owner)
        };
      }
      var project = thisUser.createProject(body, function (err) {
        data.creatingProject = false;
        if (err) {
          data.newNameTaken = true;
          throw err;
        }
        cb(err, thisUser, project);
      });
    }

    function createBuildAndContext(thisUser, project, cb) {
      var count = callbackCount(2, done);
      var build = project.defaultEnvironment.createBuild(count.next);
      var context = thisUser.createContext({
        name: project.attrs.name
      }, count.next);

      function done(err) {
        if (err) {
          throw err;
        }
        cb(err, thisUser, project, build, context);
      }
    }

    function createContextVersion(thisUser, project, build, context, cb) {
      var opts = {};
      opts.json = {
        environment: project.defaultEnvironment.id(),
      };
      opts.qs = {
        toBuild: build.id()
      };
      var contextVersion = context.createVersion(opts, function (err) {
        cb(err, thisUser, project, build, context, contextVersion);
      });
    }
    async.waterfall([
      holdUntilAuth,
      createProject,
      createBuildAndContext,
      createContextVersion
    ], function (err, thisUser, project, build) {
      $state.go('projects.setup', {
        userName: actions.getEntityName(data.activeAccount),
        projectName: project.attrs.name
      });
    });
  };

  actions.stateToInstance = function (instance) {
    if (instance && instance.id && instance.id()){
      $state.go('projects.instance', {
        instanceId: instance.id(),
        userName: $state.params.userName
      });
    }
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
      userName: $state.params.userName,
      projectName: project.attrs.name,
      branchName: ((environment) ? environment.name : 'master')
    });
  };

  actions.stateToNewProject = function (userOrOrg) {
    if (!data.showChangeAccount) {
      return;
    }
    actions.selectProjectOwner(userOrOrg, function () {
      $state.go('projects');
    });
  };

  actions.stateToEnvironment = function (branch) {
    var state = {
      userName: actions.getEntityName(data.activeAccount),
      projectName: data.activeProject.attrs.name,
      branchName: branch.attrs.name
    };
    $state.go('projects.buildList', state);
  };

  actions.setActiveProject = function (userOrOrg, project) {
    data.activeProject = project;
    data.showChangeAccount = false;
    if (userOrOrg !== data.activeAccount) {
      actions.selectProjectOwner(userOrOrg, angular.noop);
    }
    var state = {
      userName: actions.getEntityName(userOrOrg),
      projectName: project.attrs.name,
      branchName: project.defaultEnvironment.attrs.name
    };
    $state.go('projects.buildList', state);
  };

  actions.getActiveProjectName = function() {
    if ($scope.dataApp.state.current.name === 'projects') {
      return actions.getEntityName(data.activeAccount);
    }
    if ($state.params.projectName) {
      return $state.params.projectName;
    } else if (data.instances) {
      var activeInstance = data.instances.find(function (instance) {
        return instance.id() === $state.params.instanceId;
      });
      return activeInstance.attrs.project.name;
    }
  };

  /* ============================
   *   API Fetch Methods
   * ===========================*/
  function fetchOrgs(cb) {
    var thisUser = $scope.dataApp.user;
    data.orgs = thisUser.fetchGithubOrgs(function (err) {
      $scope.safeApply();
      cb(err);
    });
  }

  function selectInitialProjectOwner(cb) {
    var currentUserOrOrgName = $state.params.userName;
    if (!currentUserOrOrgName ||
      currentUserOrOrgName === actions.getEntityName($scope.dataApp.user)) {
      var toSet = data.activeAccount || $scope.dataApp.user;
      return actions.selectProjectOwner(toSet, cb);
    }
    var currentOrg = data.orgs.find(hasKeypaths({
      'attrs.login.toLowerCase()': currentUserOrOrgName.toLowerCase()
    }));
    if (currentOrg) {
      return actions.selectProjectOwner(currentOrg, cb);
    }
    return cb(new Error('User or Org not found'));
  }

  function fetchAllProjects(cb) {
    var entities = data.orgs.models.concat([$scope.dataApp.user]);
    async.each(entities, fetchUserOrOrgProjects, cb);
  }

  function fetchUserOrOrgProjects (userOrOrg, cb) {
    var thisUser = $scope.dataApp.user;
    var username = actions.getEntityName(userOrOrg);
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchProjects')
      .query({
        githubUsername: username
      })
      .cacheFetch(function updateDom(projects, cached, cb) {
        userOrOrg.attrs.projects = projects;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, projects, cb) {
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function fetchInstances(cb) {
    var thisUser = $scope.dataApp.user;
    var id = actions.getEntityId(data.activeAccount);
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchInstances')
      .query({
        owner: {
          github: id
        }
      })
      .cacheFetch(function updateDom(instances, cached, cb) {
        dataProjectLayout.data.instances = instances;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, projects, cb) {
        $scope.safeApply();
        cb();
      })
      .go();
  }

  function setInitialActiveProject (cb) {
    var projectName = actions.getActiveProjectName();
    data.activeProject = data.activeAccount.attrs.projects.find(function (project) {
      return project.attrs.name === projectName;
    });
    cb();
  }

  function fetchProjectInstances (cb) {
    var thisUser = $scope.dataApp.user;
    var entityId = actions.getEntityId(data.activeAccount);
    var projectId = data.activeProject.id();
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchInstances')
      .query({
        owner: {
          github: entityId
        },
        project: projectId
      })
      .cacheFetch(function updateDom(instances, cached, cb) {
        dataProjectLayout.data.projectInstances = instances;
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
      selectInitialProjectOwner,
      fetchAllProjects,
      fetchInstances,
      setInitialActiveProject,
      fetchProjectInstances
    ], function (err) {
      if (err) {
        $state.go('404');
        throw err;
      }
      $scope.safeApply();
    });
  };
  /**
   * New project page
   */
  actions.initForNewState = function () {
    async.waterfall([
      holdUntilAuth,
      fetchOrgs,
      selectInitialProjectOwner,
      fetchAllProjects
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
