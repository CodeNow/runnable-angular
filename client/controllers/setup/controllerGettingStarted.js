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
  errs
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

  function fetchBuild(cb) {
    $scope.build = $scope.user.fetchBuild({id: $stateParams.buildId}, cb);
  }
  async.waterfall([
    function (cb) {
      fetchUser(function(err, user) {
        if (err) { return cb(err); }
        $scope.user = user;
        cb();
      });
    },
    fetchBuild
  ], errs.handler);


  keypather.set($scope, 'actions.createAndBuild', function() {
    // first thing to do is generate the dockerfile
    var dockerfile = generateDockerFile($scope.state.stack.dockerFile, $scope);
    $scope.opts.env = generateEnvs($scope);
    async.series([
      updateNewDockerfile(dockerfile, $scope)

    ]);

    // Start the creation of the main instance
    function createInstanceFunction(cb) {
      function build(cb) {
        var unwatch = $scope.$watch('openItems.isClean()', function (n) {
          if (!n) { return; }
          unwatch();
          $scope.data.build.build({
            message: 'Initial Build'
          }, cb);
        });
      }

      function attach(cb) {
        $scope.state.opts.owner = {
          github: $scope.activeAccount.oauthId()
        };
        $scope.state.opts.build = $scope.data.build.id();
        $scope.instance = $rootScope.dataApp.data.instances.create($scope.state.opts, cb);
      }
      async.series([
        build,
        attach
      ], cb);
    }

    // Then start the forking of the deps
    var items = $scope.state.dependencies.models.map(function (dep) {
      return {
        instance: dep,
        opts: dep.opts
      };
    });
    forkInstance(items, function() {

    });
  });


  $scope.$on('$destroy', function () {
  });

  function forkInstance(createInstanceFunction, items, cb) {
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
    parallelFunctions.unshift(createInstanceFunction);
    async.parallel(parallelFunctions, function (err) {
      if (err) {
        throw err;
      }
      $state.go('instance.instance', {
        userName: $stateParams.userName,
        instanceName: keypather.get(items[0], 'opts.name')
      });
      $scope.$emit('INSTANCE_LIST_FETCH', $stateParams.userName);
      if (cb) {
        cb();
      }
    });
  }
}

function generateDockerFile(originalStackStartPoint, $scope) {
  // first, add the ports
  var df = originalStackStartPoint;
  $scope.state.ports.split(',').forEach(function(port) {
    df += '\nEXPOSE ' + port;
  });
  df += '\nCMD ' + $scope.state.startCommand;
  return df;
}

function generateEnvs($scope) {
  var envList = [];
  $scope.state.dependencies.models.forEach(function(dep) {
    dep.env.forEach(function(env) {
      envList.push(env.envName + '=' + env.url);
    });
  });
  return envList;
}

function updateNewDockerfile(dockerfile, $scope) {
  return function(cb) {
    var cv = $scope.data.build.contextVersions.models[0];
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