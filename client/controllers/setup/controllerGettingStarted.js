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
  hasKeypaths,
  QueryAssist,
  regexpQuote,
  getNewForkName,
  fetchInstances,
  createDockerfileFromSource,
  fetchGSDepInstances,
  errs,
  $log
) {
  $scope.state = {
    unsavedAcvs: [],
    opts: {
      name: 'NewInstance'
    }
  };
  $scope.$watchCollection('state.unsavedAcvs', function(n) {
    if (n && n.length) {
      n.forEach(function(acv) {
        fetchStackInfo(acv.unsavedAcv.attrs.repo, function (err, data) {
          $scope.stackData = data;
        });
      });
    }
  });
  $scope.$watch('stackData', function(n) {
    if (n) {
      $scope.$watch('data.allDependencies', function(allDeps) {
        if (allDeps) {
          keypather.set($scope, 'state.dependencies.models', n.map(function(dep) {
            allDeps.find(hasKeypaths({'attrs.name': dep}));
          }));
        }
      });
      keypather.set($scope, 'state.stack', n.stack);
      $scope.$watch('build', function(n) {
        if (n) {
          createDockerfileFromSource(n, 'New Node Template', function (err, dockerfile) {
            if (err) {
              return errs.handler(err);
            }
            $scope.dockerfile = dockerfile;
          });
        }
      });
    }
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
    fetchBuild,
    fetchDepInstanceList
  ], errs.handler);

  function fetchDepInstanceList(cb) {
    fetchGSDepInstances(function(err, deps) {
      keypather.set($scope, 'data.allDependencies', deps);
    });
  }

  keypather.set($scope, 'actions.createAndBuild', function() {
    // first thing to do is generate the dockerfile
    $scope.$watch('dockerfile', function (n) {
      if (n) {
        $rootScope.dataApp.data.loading = true;
        var dockerfile = populateDockerFile(n.attrs.body);
        $log.log('DOCKERFILE: \n' + dockerfile);

        var depModels = $scope.state.dependencies.models.map(function (dep) {
          return {
            instance: dep,
            opts: {
              name: getNewForkName(dep, $scope.instanceList, true),
              env: dep.attrs.env
            }
          };
        });
        $scope.state.opts.env = generateEnvs(depModels);
        $log.log('ENVS: \n' + $scope.state.opts.env);
        async.series([
          updateNewDockerfile(n, dockerfile),
          forkDeps,
          createInstance
        ], errs.handler);
      }
    });
  });


  // Start the creation of the main instance
  function createInstance(cb) {
    function build(cb) {
      $scope.build.build({
        message: 'Initial Build'
      }, cb);
    }

    function attach(cb) {
      $scope.state.opts.name = getNewForkName({
        attrs: {
          name: $scope.mainRepoName
        }
      }, $scope.instanceList, true);
      $scope.state.opts.owner = {
        github: $rootScope.dataApp.data.activeAccount.oauthId()
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
      return {
        instance: dep,
        opts: {
          name: getNewForkName(dep, $scope.instanceList, true),
          env: dep.attrs.env
        }
      };
    });
    forkInstances(items, cb);

    function forkInstances(items, cb) {
      //$rootScope.dataApp.data.loading = true;
      function fork(instance, opts, cb) {
        instance.copy(opts, cb);
      }

      var parallelFunctions = items.map(function (item) {
        return function (cb) {
          fork(item.instance, item.opts, cb);
        };
      });
      async.parallel(parallelFunctions, cb);
    }
  }

  function populateDockerFile(dockerfile) {
    // first, add the ports
    Object.keys($scope.state.version).forEach(function(stackName) {
      var regexp = new RegExp('<' + regexpQuote(stackName.toLowerCase()) + '-version>', 'gm');
      console.log('replacing version', stackName, regexp);
      dockerfile = dockerfile.replace(regexp, $scope.state.version[stackName]);
    });
    var ports = '';
    $scope.state.ports.split(',').forEach(function (port) {
      ports += '\nEXPOSE ' + port;
    });
    dockerfile = dockerfile.replace(/<user-specified-ports>/gm, ports);
    var repos = '';
    $scope.state.unsavedAcvs.forEach(function (acv, index) {
      var repoName = acv.unsavedAcv.attrs.repo.split('\/')[1];
      if (index === 0) {
        $scope.mainRepoName = repoName;
      }
      repos += '\nADD .\/' + repoName + ' \/' + repoName;
    });
    dockerfile = dockerfile.replace(/<add-repo>/gm, repos);
    dockerfile = dockerfile.replace(/<repo-name>/gm, $scope.mainRepoName);

    // For now, just remove this
    dockerfile = dockerfile.replace(/<add-dependencies>/gm, '');
    var startCommand = '\nCMD ' + $scope.state.startCommand;
    dockerfile = dockerfile.replace(/<start-command>/gm, startCommand);
    return dockerfile;
  }

  function generateEnvs(depModels) {
    var envList = [];
    depModels.forEach(function(item) {
      if (item.dep.reqEnvs) {
        item.dep.reqEnvs.forEach(function(env) {
          envList.push(env.name + '=' + env.url);
        });
      }
    });
    return envList;
  }

  function updateNewDockerfile(dockerfile, body) {
    return function(cb) {
      dockerfile.update({
        json: {
          body: body
        }
      }, cb);
    };
  }

}

