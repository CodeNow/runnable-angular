require('app')
  .controller('ControllerBuildList', ControllerBuildList);
/**
 * ControllerBuildList
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerBuildList(
  $scope,
  $rootScope,
  $window,
  user,
  $stateParams,
  $state,
  async,
  keypather,
  hasKeypaths,
  callbackCount
) {

  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var self = ControllerBuildList;
  var dataBuildList = $scope.dataBuildList = self.initState();
  var data = dataBuildList.data;
  var actions = dataBuildList.actions;

  var pce = data.popoverChangeEnvironment = {
    actions: {},
    data: {}
  };
  pce.data.environments = null;
  pce.data.filter = '';
  pce.data.show = false;
  pce.actions.createNewEnvironment = function (event) {
    console.log(event);
    if (event.keyCode !== 13) {
      return;
    }
    var count = callbackCount(2, done);
    var project = dataBuildList.data.project;
    var body = {
      name: pce.data.filter
    };
    var env = project.createEnvironment(body, count.next);
    var query = {
      sort: '-buildNumber'
    };
    var builds = project.defaultEnvironment.fetchBuilds(query, count.next);

    function done(err) {
      if (err) {
        throw err;
      }
      var newBuild = env.createBuild({
        parentBuild: builds.models[0].id()
      }, function (err) {
        if (err) {
          throw err;
        }
        newBuild.build({
          message: 'initial build'
          //  environment: env.id()
        }, function (err) {
          if (err) {
            throw err;
          }
          var sc = angular.copy($stateParams);
          sc.branchName = env.attrs.name;
          sc.buildName = newBuild.attrs.buildNumber;
          $state.go('projects.build', sc);
        });
      });
    }
  };
  pce.actions.actionsModalDeleteEnvironment = {
    deleteRecipe: function (env) {
      env.destroy(function (err) {
        if (!err) {
          data.project.fetch(function (err, project) {
            var defEnv = project.environments.filter(hasKeypaths({
              _id: project.defaultEnvironment
            }))[0];
            var sc = angular.copy($stateParams);
            sc.branchName = defEnv.name;
            $state.go('projects.buildList', sc);
          });
        }
      });
    }
  };

  data.dataModalDelete = {};
  actions.actionsModalDelete = {
    deleteProject: function (cb) {
      dataBuildList.data.project.destroy(function () {
        $state.go('home');
      });
    }
  };
  data.sortState = {
    column: false,
    direction: 'ascending' //desc
  };

  $scope.$watch('dataBuildList.data.project.attrs.name', function (newval, oldval) {
    if (typeof oldval !== 'string') {
      return;
    }
    dataBuildList.data.project.update({
      name: newval
    }, function () {
      $stateParams.projectName = newval;
    });
  });

  actions.getTriggeredActionText = function (build) {
    var triggeredAction = keypather.get(build, 'contextVersions.models[0].attrs.build.triggeredAction');
    if (!triggeredAction) {
      return;
    }
    if (triggeredAction.manual) {
      return 'Manual';
    }
    if (triggeredAction.rebuild) {
      return 'Rebuild';
    }
    // assume github
    var appCodeVersion = triggeredAction.appCodeVersion;
    return appCodeVersion.repo + '#' + appCodeVersion.repo;
  };

  actions.runInstance = function (build) {
    var user = $scope.dataApp.user;
    var instance = user.createInstance({
      json: {
        build: build.id()
      }
    }, function (err) {
      if (err) {
        throw err;
      }
      var state = {
        instanceId: instance.id(),
        userName: $state.params.userName
      };
      $state.go('projects.instance', state);
    });
  };

  actions.stateToInstance = function (buildId) {
    var state = {
      userName: $state.params.userName,
      projectName: data.project.attrs.name,
      branchName: data.environment.attrs.name,
      buildName: build.attrs.id,
      instanceId: '12345'
    };
    $state.go('projects.instance', state);
  };

  actions.stateToBuild = function (build) {
    var state = {
      userName: $state.params.userName,
      projectName: data.project.attrs.name,
      branchName: data.environment.attrs.name,
      buildName: build.attrs.buildNumber
    };
    $state.go('projects.build', state);
  };

  actions.toggleSortBy = function (columnName) {
    if (columnName === data.sortState.column) {
      data.sortState.direction = (data.sortState.direction === 'ascending') ? 'descending' : 'ascending';
      return;
    }
    data.sortState.column = columnName;
    data.sortState.direction = 'ascending';
    fetchBuilds();
  };

  actions.getSortParam = function () {
    var column = data.sortState.column;
    var direction = data.sortState.direction;
    if (!column) {
      return '-buildNumber';
    }
    return ((direction === 'ascending') ? '-' : '') + column;
  };

  actions.stateToSetupFirstBuild = function () {
    $state.go('projects.setup', {
      userName: $scope.dataApp.stateParams.userName,
      projectName: $scope.dataApp.stateParams.projectName
    });
  };

  /* ============================
   *   API Fetch Methods
   * ===========================*/
  function fetchProject(cb) {
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchProjects')
      .query({
        ownerUsername: $stateParams.userName,
        name: $stateParams.projectName
      })
      .cacheFetch(function updateDom(projects, cached, cb) {
        var project = projects.models[0];
        if (!project) {
          return cb(new Error('project not found in redirect'));
        }
        data.project = project;
        data.dataModalDelete.project = project;
        var env = project.environments.find(hasKeypaths({
          'attrs.name.toLowerCase()': $stateParams.branchName
        }));
        if (!env) {
          return cb(new Error('Environment not found redirect'));
        }
        data.environment = env;
        pce.data.environments = project.environments;
        cb();
        $scope.safeApply();
      })
      .resolve(function (err, projects, cb) {
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  function fetchBuilds(cb) {
    new QueryAssist(data.environment, cb)
      .wrapFunc('fetchBuilds')
      .query({
        environment: data.environment.id(),
        started: true,
        sort: actions.getSortParam() //'-buildNumber'
      })
      .cacheFetch(function updateDom(builds, cached, cb) {
        if (builds.models.length === 0) {
          // redirect to create new build page
          return cb(new Error('build not found'));
        }
        if (builds.models.length === 1 && !builds.models[0].attrs.started) {
          actions.stateToSetupFirstBuild();
          return cb();
        }
        data.builds = builds;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, builds, cb) {
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  actions.initState = function () {
    async.waterfall([
      holdUntilAuth,
      fetchProject,
      fetchBuilds
    ], function (err, project, environments, environment, builds) {
      if (err) {
        // TODO error handling
        $state.go('404');
        throw err;
      }
      $scope.safeApply();
    });
  };
  actions.initState();
}

ControllerBuildList.initState = function () {
  return {
    data: {
      predicate: '',
      ascending: false
    },
    actions: {}
  };
};

ControllerBuildList.initPopoverState = function () {
  return {};
};
