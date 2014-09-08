require('app')
  .controller('ControllerInstanceLayout', ControllerInstanceLayout);
/**
 * @ngInject
 */
function ControllerInstanceLayout(
  $scope,
  async,
  $state,
  $stateParams,
  user,
  keypather,
  callbackCount,
  hasKeypaths
){
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var self = ControllerInstanceLayout;
  var dataInstanceLayout = $scope.dataInstanceLayout = {};
  var data = dataInstanceLayout.data = {};
  var actions = dataInstanceLayout.actions = {};

/*
  actions.selectProjectOwner = function (userOrOrg, cb) {
    var name = actions.getEntityName(userOrOrg);
    data.activeAccount = userOrOrg;
    data.showChangeAccount = false;

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
      $state.go('box.boxInstance', {
        userName: name,
        shortHash: data.activeProject.id()
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
    if (dataInstanceLayout.data.newProjectNameForm.$invalid) {
      return;
    }
    var thisUser = $scope.dataApp.user;
    var body;
    $scope.dataApp.data.loading = true;
    data.creatingProject = true;

    function createProject(cb) {
      body = {
        name: dataInstanceLayout.data.newProjectName,
        owner: {
          github: data.activeAccount.oauthId()
        }
      };
      var project = thisUser.createProject(body, function (err) {
        $scope.dataApp.data.loading = false;
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
      var context = thisUser.createContext(body, count.next);

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
      data.activeProject = project;
      $state.go('projects.setup', {
        userName: data.activeAccount.oauthName(),
        projectName: project.attrs.name
      });
    });
  };

  actions.stateToInstance = function (instance) {
    if (instance && instance.id && instance.id()){
      $state.go('instance.instance', {
        shortHash: instance.id(),
        userName: $state.params.userName
      });
    }
  };

  actions.stateToNewProject = function (userOrOrg) {
    actions.selectProjectOwner(userOrOrg, function () {
      $state.go('projects');
    });
  };

  actions.setActiveProject = function (userOrOrg, project) {
    data.activeProject = project;
    data.showChangeAccount = false;

    var finish = function () {
      var state = {
        userName: userOrOrg.oauthName(),
        shortHash: project.id()
      };
      setInitialActiveProject(function() {
        $state.go('instance.instance', state);
      });
    };

    if (userOrOrg !== data.activeAccount) {
      return async.series([
        function (cb) {
          actions.selectProjectOwner(userOrOrg, cb);
        },
        fetchInstances
      ], finish);
    }
    finish();
  };

  /*
  actions.getActiveProjectName = function() {
    if ($scope.dataApp.state.current.name === 'projects') {
      return actions.getEntityName(data.activeAccount);
    }
    if (data.activeProject) {
      // Useful when we've set a new project but haven't updated $state
      return data.activeProject.attrs.name;
    }

    if ($state.params.projectName) {
      return $state.params.projectName;
    } else if (data.instances) {
      var activeInstance = data.instances.find(function (instance) {
        return instance.id() === $state.params.instanceId;
      });
      if (activeInstance) {
        return activeInstance.attrs.project.name;
      }
      return '';
    }
  };
  */

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

  function setActiveAccount (cb) {
    var currentUserOrOrgName = $state.params.userName;

    if (!currentUserOrOrgName || currentUserOrOrgName === $scope.dataApp.user.oauthName()) {
      data.activeAccount = $scope.dataApp.user;
      return cb();
    }
    var currentOrg = data.orgs.find(hasKeypaths({
      'attrs.login.toLowerCase()': currentUserOrOrgName.toLowerCase()
    }));
    if (currentOrg) {
      data.activeAccount = currentOrg;
      return cb();
    }
    return cb(new Error('User or Org not found'));
  }

  /*
  function fetchAllProjects(cb) {
    var entities = data.orgs.models.concat([$scope.dataApp.user]);
    async.each(entities, fetchUserOrOrgProjects, cb);
  }
  */

  // TODO: no more projects.
  /*
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
  */

  function fetchInstances(cb) {
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchInstances')
      .query({
        owner: {
          github: data.activeAccount.oauthId()
        }
      })
      .cacheFetch(function updateDom(instances, cached, cb) {
        dataInstanceLayout.data.instances = instances;
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
    data.projectInstances = data.instances.filter(function (instance) {
      return keypather.get(instance, 'attrs.project.name') === projectName;
    });
    cb();
  }

  /**
   * All pages besides new project page
   */
  actions.initForState = function () {
    async.waterfall([
      holdUntilAuth,
      fetchOrgs,
      setActiveAccount,
      fetchInstances
      //selectInitialProjectOwner,
      //fetchAllProjects,
      //setInitialActiveProject
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
      //selectInitialProjectOwner,
      //fetchAllProjects
    ]);
  };

  $scope.$watch('dataApp.state.current.name', function (newval, oldval) {
    if (newval.indexOf('instance.') === 0) {
      actions.initForState();
    } else if (newval === 'instance') {
      actions.initForNewState();
    }
  });

  $scope.$on('app-document-click', function () {
    $scope.dataInstanceLayout.data.showChangeAccount = false;
  });

}
