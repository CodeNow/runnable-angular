require('app')
  .controller('ControllerInstanceLayout', ControllerInstanceLayout);
/**
 * @ngInject
 */
function ControllerInstanceLayout(
  $scope,
  $filter,
  $window,
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

  /**
   * Triggered when click instance in list on left panel
   */
  actions.stateToInstance = function (instance) {
    if (instance && instance.id && instance.id()){
      $state.go('instance.instance', {
        instanceName: instance.attrs.name,
        userName: $state.params.userName
      });
    }
  };

  /**
   * Fetches a hash of classes for each instance displayed
   * in ng-repeat
   */
  actions.getInstanceClasses = function (instance) {
    if (!instance) {
      return {}; //async loading handling
    }
    var container = keypather.get(instance, 'containers.models[0]');
    var build = keypather.get(instance, 'build');
    var h = {};
    h.active = (instance.attrs.name === $scope.dataApp.stateParams.instanceName);
    h.running = container && container.running();
    h.stopped = !h.running;
    h.building = build && !build.attrs.completed;
    h.failed = build && build.failed();
    return h;
  };

  /**
   * Gets alternate text for instance based on instance state
   */
  actions.getInstanceAltTitle = function (instance) {
    var state = actions.getInstanceClasses(instance);
    if (state.failed) {
      return "Build failed";
    }
    if (state.running) {
      return "Started " + $filter('timeAgo')(keypather.get(instance, 'containers.models[0].attrs.inspect.State.StartedAt'));
    }
    if (state.stopped) {
      return "Stopped " + $filter('timeAgo')(keypather.get(instance, 'containers.models[0].attrs.inspect.State.FinishedAt'));
    }
    if (state.building) {
      return "Build in progress";
    }
    return "";
  };

  // invoked from controllerSetup when new instance is created
  // actions.fetchInstances = fetchInstances;

  actions.selectActiveAccount = function (userOrOrg, cb) {
    data.showChangeAccount = false;
    var name = userOrOrg.oauthName();
    data.activeAccount = userOrOrg;
    data.showChangeAccount = false;
    $scope.safeApply();

    if (cb) {
      return cb();
    }

    /*
    fetchInstances(function (err) {
      $scope.safeApply();
      if (err) {
        return $state.go('error', {
          err: err
        });
      }
      if (name === $state.params.userName) {
        // First fetch for the page or we're on /new
        return;
      }
      if (!data.instances.models.length) {
        // new project
        return $state.go('instance.new', {
          userName: name
        });
      }
      $state.go('instance.instance', {
        userName: name,
        instanceName: data.instances.models[0].attrs.name
      });
    });
    */
  };

  actions.stateToNew = function () {
    $state.go('instance.new', {
      userName: data.activeAccount.oauthName()
    });
  };

/* ============================
   *   API Fetch Methods
   * ===========================*/
  /*
  function fetchOrgs(cb) {
    var thisUser = $scope.dataApp.user;
    data.orgs = thisUser.fetchGithubOrgs(function (err) {
      $scope.safeApply();
      if ($window.heap) {
        // Heap will only be loaded when env !== developm
        $window.heap.identify({
          name: thisUser.oauthName(),
          email: thisUser.email,
          orgs: $window.JSON.stringify(data.orgs)
        });
      }
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
        data.instances = instances;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, projects, cb) {
        $scope.safeApply();
        cb();
      })
      .go();

    // for caching, fetch instances of all other orgs
    async.map(data.orgs, function (org, cb) {
      thisUser.fetchInstances({
        owner: {
          github: org.oauthId()
        }
      }, function () {
        cb(null);
      });
    });
  }
  */

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
  /*
    async.waterfall([
      holdUntilAuth,
      fetchOrgs,
      setActiveAccount,
      fetchInstances
    ], function (err) {
      if (err) {
        $state.go('error', {
          err: err
        });
        throw err;
      }
      $scope.safeApply();
    });
  */

  $scope.$on('app-document-click', function () {
    $scope.dataInstanceLayout.data.showChangeAccount = false;
  });

}
