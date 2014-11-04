require('app')
  .controller('ControllerSetup', ControllerSetup);
/**
 * ControllerSetup
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerSetup(
  $scope,
  $state,
  async,
  keypather,
  hasKeypaths,
  OpenItems,
  debounce,
  validateDockerfile,
  addTab
) {
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var QueryAssist = $scope.UTIL.QueryAssist;
  var self = ControllerSetup;
  var dataSetup = $scope.dataSetup = self.initState();
  var data = dataSetup.data;
  var actions = dataSetup.actions;
  data.openItems = new OpenItems();

  data.popoverAddTab = addTab({
    envVars: true
  }, data.openItems);

  // Determine readonly state
  $scope.$watch(function () {
    if (data.contextFiles) {
      return !data.isAdvanced;
    }
    return true;
  }, function (bool) {
    data.isReadOnly = bool;
  });

  $scope.$on('app-document-click', function () {
    data.isRepoMode = false;
    data.repoFilter = '';
  });

  actions.selectGithubRepo = function (repo) {
    if (data.selectedRepos.contains(repo)) {
      delete repo.selectedBranch;
      data.selectedRepos.remove(repo);
    } else {
      data.selectedRepos.add(repo);
    }

    repo.branches = repo.fetchBranches({}, function () {
      $scope.safeApply();
    });

    $scope.safeApply();
  };

  actions.addGithubRepos = function (valid) {
    if(!valid) {
      return;
    }
    var count = data.selectedRepos.models.length;
    async.forEach(data.selectedRepos.models, function (repo, cb) {
      var body = {
        repo: repo.attrs.full_name
      };
      if (repo.selectedBranch) {
        body.branch = repo.selectedBranch;
      }
      else if (repo.selectedCommit) {
        body.commit = repo.selectedCommit;
      }
      else {
        body.branch = repo.defaultBranch();
      }
      count = count - 1;
      if (count === 0) {
        assumeSuccess();
      }
      data.contextVersion.appCodeVersions.create(body, function () {
        $scope.safeApply();
        cb();
      });
    }, function (err) {
      if (err) {
        revertOnErr();
        throw err;
      }
    });
    var lastModels;
    function assumeSuccess () {
      lastModels = data.selectedRepos.models;
      data.selectedRepos.reset([]);
      data.isRepoMode = false;
      data.repoFilter = '';
      $scope.safeApply();
    }
    function revertOnErr () {
      data.selectedRepos.reset(lastModels);
      data.isRepoMode = true;
      data.repoFilter = '';
      $scope.safeApply();
    }
  };

  actions.removeGithubRepo = function (appCodeVersion) {
    data.contextVersion.appCodeVersions.destroy(appCodeVersion, function (err) {
      if (err) {
        throw err;
      }
      $scope.safeApply();
    });
  };

  actions.validateBranchOrCommit = function (repo) {
    delete repo.selectedCommit;
    delete repo.selectedBranch;
    repo.valid = false;
    if (isBranch(repo.selectedBranchOrCommit)) {
      repo.selectedBranch = repo.selectedBranchOrCommit;
      repo.valid = true;
    }
    else {
      repo.selectedCommit = repo.selectedBranchOrCommit;
      repo.fetchCommit(repo.selectedCommit, function (err) {
        if (!err) {
          repo.valid = true;
          $scope.safeApply();
        }
      });
    }
    $scope.safeApply();

    function isBranch (name) {
      return repo.branches.models.some(function (name) {
        return repo.name === name;
      });
    }
  };

  /**
   * set active context && fetch build files for display
   */
  actions.selectSourceContext = function (context) {
    if (keypather.get(data, 'sourceContextVersion.attrs.context') === context.id()) {
      // They selected the same template
      return;
    }
    data.openItems.reset([]);
    data.fetchingContext = true;
    data.contextSelected = true;
    fetchContextVersion(context, function (err) {
      if (err) {
        throw err;
      }
      data.fetchingContext = false;
      if (keypather.get(data, 'contextVersion.source') === data.sourceContextVersion.id()) {
        // nothing
      } else {
        var sourceInfraCodeVersion = data.sourceContextVersion.attrs.infraCodeVersion;
        data.contextVersion.copyFilesFromSource(
          sourceInfraCodeVersion,
          function (err) {
            if (err) {
              throw err;
            }
            data.contextVersion.source = data.sourceContextVersion.id();
            fetchContextVersionFiles(data.contextVersion, function (err) {
              if (err) {
                throw err;
              }
              data.isReadOnly = false;
              $scope.safeApply();
            });
          });
      }
    });
  };

  actions.buildApplication = function () {
    $scope.dataApp.data.loading = true;
    data.creatingProject = true;
    async.series([

      function (cb) {
        data.build.build({
          message: 'Initial build'
        }, cb);
      },
      function (cb) {
        var thisUser = $scope.dataApp.user;
        var instanceOwner = $scope.dataInstanceLayout.data.activeAccount.oauthId();
        var instanceParams = {
          owner: {
            github: instanceOwner
          },
          build: data.build.id(),
          name: data.newProjectName
        };
        if (data.state) {
          instanceParams.env = data.state.env;
        }
        data.instance = thisUser.createInstance(instanceParams, cb);
      }
    ], function (err) {
      if (err) throw err;
      $scope.dataApp.data.loading = false;
      // we need to refetch instances collection
      // to update list of instances
      $scope.dataInstanceLayout.actions.fetchInstances(angular.noop);

      dataSetup.actions.stateToBuild();
    });
  };

  actions.valid = function (strict) {
    var valid = !keypather.get(data, 'newProjectNameForm.$invalid') && data.contextSelected;
    if (strict) {
      return valid && !keypather.get(data, 'validDockerfile.errors.length');
    }
    return valid;
  };

  actions.stateToBuild = function () {
    data.creatingProject = true;
    $state.go('instance.instance', {
      userName: $state.params.userName,
      instanceName: data.instance.attrs.name
    });
  };

  var debounceValidate = debounce(function (n) {
    if (n === undefined || data.openItems.activeHistory.last().id() !== '/Dockerfile') {
      data.validDockerfile = {
        valid: true
      };
      $scope.safeApply();
      return;
    }
    data.validDockerfile = validateDockerfile(n);
    $scope.safeApply();
  }, 333);

  $scope.$watch('dataSetup.data.openItems.activeHistory.last().attrs.body', debounceValidate);

  /* ============================
   *   API Fetch Methods
   * ===========================*/

   /*** INIT ***/
  function fetchBuild(cb) {
    var thisUser = $scope.dataApp.user;
    var id = $state.params.buildId;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchBuild')
      .query(id)
      .cacheFetch(function updateDom(build, cached, cb) {
        if (!build || build.attrs.started) {
          // TODO
          // actions.stateToBuildList();
        } else {
          // first build
          data.build = build;
          data.contextVersion = build.contextVersions.models[0];
          $scope.safeApply();
          cb();
        }
      })
      .resolve(function (err, build, cb) {
        if (!build) {
          return cb(new Error('Build not found'));
        }
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  function fetchSeedContexts(cb) {
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchContexts')
      .query({
        isSource: true
      })
      .cacheFetch(function updateDom(contexts, cached, cb) {
        data.seedContexts = contexts;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, contexts, cb) {
        if (!contexts) {
          return cb(new Error('Seed Contexts not found'));
        }
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  /*** AFTER PAGE INIT ***/

  function fetchContext(cb) {
    var build = data.build;
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchContext')
      .query(build.attrs.contexts[0])
      .cacheFetch(function updateDom(context, cached, cb) {
        data.context = context;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, context, cb) {
        if (!context) {
          return cb(new Error('Context not found'));
        }
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  function fetchContextVersion(context, cb) {
    new QueryAssist(context, cb)
      .wrapFunc('fetchVersions')
      .cacheFetch(function updateDom(versions, cached, cb) {
        if (context.attrs.isSource) {
          data.sourceContextVersion = versions.models[0]; // assume only 1 version exists for sources, for now.
        } else {
          data.contextVersion = versions.models[0]; // assume only 1 version exists for sources, for now.
        }
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, versions, cb) {
        if (!versions.models.length) {
          return cb(new Error('Source Context Versions not found'));
        }
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  function fetchContextVersionFiles(contextVersion, cb) {
    new QueryAssist(contextVersion, cb)
      .wrapFunc('fetchFsList')
      .query({
        path: '/'
      })
      .cacheFetch(function updateDom(files, cached, cb) {
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, files, cb) {
        if (err) {
          throw err;
        }
        if (!files) {
          return cb(new Error('Context Version Files not found'));
        }
        data.openItems.reset([]);
        data.openItems.add(files.models);
        // hacky trigger to let file-tree know change has occured and it needs to refetch
        keypather.set(data.openItems, 'state.reset', new Date());
        $scope.safeApply();
      })
      .go();
  }

  actions.initState = function () {
    async.waterfall([
      holdUntilAuth,
      fetchSeedContexts,
      fetchBuild
    ], function (err) {
      if (err) {
        $state.go('error', {
          err: err
        });
        throw err;
      }
      $scope.safeApply();
    });
  };
  actions.initState();
}

ControllerSetup.initState = function () {
  return {
    data: {
      isAdvanced: false,
      isRepoMode: false,
      fetchingContext: false
    },
    actions: {}
  };
};
