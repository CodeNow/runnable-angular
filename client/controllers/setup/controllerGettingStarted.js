require('app')
  .controller('ControllerGettingStarted', ControllerGettingStarted);
/**
 * ControllerSetup
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerGettingStarted(
  async,
  $scope,
  $rootScope,
  $state,
  $stateParams,
  keypather,
  fetchStackInfo,
  fetchUser,
  QueryAssist,
  errs,
  $log
) {
  $scope.state = {
    unsavedAcvs: [],
    opts: {
      name: 'NewInstance'
    }
  };
  fetchStackInfo(null, function (err, data) {
    $scope.data = data;
    keypather.set($scope, 'state.dependencies', angular.copy($scope.data.dependencies));
    keypather.set($scope, 'state.stack', $scope.data.stack);
  });
  $scope.$on('acv-change', function (event, opts) {
    console.log(event, opts);
  });

  function fetchBuild(user, cb) {
    new QueryAssist(user, cb)
      .wrapFunc('fetchBuild')
      .query($stateParams.buildId)
      .cacheFetch(function (build, cached, cb) {
        $scope.build = build;
        cb();
      })
      .resolve(cb)
      .go();
  }
  async.waterfall([
    function (cb) {
      fetchUser(function(err, user) {
        $scope.user = user;
        cb(err, user);
      });
    },
    fetchBuild
  ], errs.handler);


  keypather.set($scope, 'actions.createAndBuild', function() {
    // first thing to do is generate the dockerfile
    var dockerfile = generateDockerFile($scope.state.stack.dockerFile);
    $log.log('DOCKERFILE: \n' + dockerfile);
    $scope.state.opts.env = generateEnvs();
    $log.log('ENVS: \n' + $scope.state.opts.env);
    async.series([
      updateNewDockerfile(dockerfile),
      forkDeps,
      createInstance
    ], errs.handler);
  });


  // Start the creation of the main instance
  function createInstance(cb) {
    function build(cb) {
      $scope.build.build({
        message: 'Initial Build'
      }, cb);
    }

    function attach(cb) {
      $scope.state.opts.owner = {
        github: $scope.activeAccount.oauthId()
      };
      $scope.state.opts.build = $scope.build.id();
      $scope.instance = $rootScope.dataApp.data.instances.create($scope.state.opts, cb);
    }

    function goToNewInstance() {
      $state.go('instance.instance', {
        userName: $stateParams.userName,
        instanceName: $scope.state.opts.name
      });
    }
    async.series([
      build,
      attach,
      goToNewInstance
    ], cb);
  }

  $scope.$on('$destroy', function () {
  });

  function forkDeps(cb) {
    // Then start the forking of the deps
    var items = $scope.state.dependencies.models.map(function (dep) {
      var dummyInstance = $scope.user.newInstance({
        shortHash: dep.attrs.shortHash
      });
      return {
        instance: dummyInstance,
        opts: dep.opts
      };
    });
    forkInstances(items, cb);

    function forkInstances(items, cb) {
      $scope.popoverGearMenu.data.show = false;
      $rootScope.dataApp.data.loading = true;
      function fork(instance, opts, cb) {
        instance.copy(opts, function (err) {
          if (err) {
            throw err;
          }
          $rootScope.safeApply();
          // update instances collection to update
          // viewInstanceList
          cb();
        });
      }

      var parallelFunctions = items.map(function (item) {
        return function (cb) {
          fork(item.instance, item.opts, cb);
        };
      });
      async.parallel(parallelFunctions, function (err) {
        if (err) {
          throw err;
        }
        if (cb) {
          cb();
        }
      });
    }
  }
  function generateDockerFile(originalStackStartPoint) {
    // first, add the ports
    var df = originalStackStartPoint;
    $scope.state.ports.split(',').forEach(function (port) {
      df += '\nEXPOSE ' + port;
    });
    $scope.state.unsavedAcvs.forEach(function (acv) {
      var repoName = acv.unsavedAcv.attrs.repo.split('\/')[1];
      df += '\nADD .\/' + repoName + ' \/' + repoName;
    });
    df += '\nCMD ' + $scope.state.startCommand;
    return df;
  }

  function generateEnvs() {
    var envList = [];
    $scope.state.dependencies.models.forEach(function(dep) {
      if (dep.requiredEnvs) {
        dep.requiredEnvs.forEach(function(env) {
          envList.push(env.envName + '=' + env.url);
        });
      }
    });
    return envList;
  }

  function updateNewDockerfile(dockerfile) {
    return function(cb) {
      var cv = $scope.build.contextVersions.models[0];
      var file = cv.rootDir.contents.find(function(file) {
        return (file.attrs.name === 'Dockerfile');
      });
      file.update({
        json: {
          body: dockerfile
        }
      }, cb);
    };
  }
}

