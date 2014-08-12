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
  OpenItems
) {
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var QueryAssist = $scope.UTIL.QueryAssist;
  var self = ControllerSetup;
  var dataSetup = $scope.dataSetup = self.initState();
  var data = dataSetup.data;
  var actions = dataSetup.actions;
  data.openItems = new OpenItems();

  // Determine readonly state
  $scope.$watch(function () {
    if (data.contextFiles) {
      return !data.isAdvanced;
    }
    return true;
  }, function (bool) {
    data.isReadOnly = bool;
  });

  actions.selectGithubRepo = function (repo, branchName) {
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

  actions.addGithubRepos = function () {
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
        body.branch = 'master';
      }
      count = count - 1;
      if (count === 0) {
        assumeSuccess();
      }
      data.contextVersion.appCodeVersions.create(body, cb);
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
      $scope.safeApply();
    }
    function revertOnErr () {
      data.selectedRepos.reset(lastModels);
      data.isRepoMode = true;
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

  actions.selectBranchOrCommit = function (repo) {
    delete repo.selectedCommit;
    delete repo.selectedBranch;
    repo.invalid = true;
    if (isBranch(repo.selectedBranchOrCommit)) {
      repo.selectedBranch = repo.selectedBranchOrCommit;
    }
    else {
      repo.selectedCommit = repo.selectedBranchOrCommit;
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
    data.selectedSourceContext = context;
    fetchContextVersion(context, function (err) {
      if (err) {
        throw err;
      }
      if (data.contextVersion.source === data.sourceContextVersion.id()) {
        // nothing
      } else {
        var sourceInfraCodeVersion = data.sourceContextVersion.attrs.infraCodeVersion;
        data.contextVersion.copyFilesFromSource(
          sourceInfraCodeVersion,
          function (err) {
            if (err) {
              throw err;
            }
            data.sourceFilesCopied = true;
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
    async.series([

      function (cb) {
        data.build.build({
          message: 'Initial build'
        }, cb);
      },
      function (cb) {
        data.build.fetch(cb);
      }
    ], function (err, results) {
      if (err) throw err;
      dataSetup.actions.stateToBuild();
    });
  };

  actions.stateToBuild = function () {
    $state.go('projects.build', {
      userName: $scope.dataApp.stateParams.userName,
      projectName: keypather.get(data, 'project.attrs.name') ||
        $scope.dataApp.stateParams.projectName,
      branchName: data.project.defaultEnvironment.attrs.name,
      buildName: data.build.attrs.buildNumber
    });
  };

  actions.stateToBuildList = function () {
    $state.go('projects.buildList', {
      userName: $scope.dataApp.stateParams.userName,
      projectName: $scope.dataApp.stateParams.projectName,
      branchName: data.project.defaultEnvironment.attrs.name
    });
  };

  actions.initState = function () {
    async.waterfall([
      holdUntilAuth,
      fetchProject,
      fetchSeedContexts,
      fetchFirstBuild,
      fetchOwnerRepos
    ], function (err) {
      if (err) {
        $state.go('404');
        throw err;
      }
      $scope.safeApply();
    });
  };
  actions.initState();

  /* ============================
   *   API Fetch Methods
   * ===========================*/
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

  function fetchProject(cb) {
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchProjects')
      .query({
        githubUsername: $scope.dataApp.stateParams.userName,
        name: $scope.dataApp.stateParams.projectName
      })
      .cacheFetch(function updateDom(projects, cached, cb) {
        data.project = projects.models[0];
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, projects, cb) {
        if (!projects.models.length) {
          return cb(new Error('Projects not found'));
        }
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  function fetchFirstBuild(cb) {
    var project = data.project;
    var environment = project.defaultEnvironment;
    new QueryAssist(environment, cb)
      .wrapFunc('fetchBuilds')
      .cacheFetch(function updateDom(builds, cached, cb) {
        if (builds.models.length > 1 || builds.models[0].attrs.started) {
          actions.stateToBuildList();
        } else {
          // first build
          data.build = builds.models[0];
          data.contextVersion = builds.models[0].contextVersions.models[0];
          $scope.safeApply();
          cb();
        }
      })
      .resolve(function (err, builds, cb) {
        if (!builds.models.length) {
          return cb(new Error('Build not found'));
        }
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  function fetchOwnerRepos(cb) {
    var thisUser = $scope.dataApp.user;
    var build = data.build;
    var query;

    if (thisUser.isOwnerOf(data.project)) {
      data.selectedRepos = data.selectedRepos || thisUser.newGithubRepos([], {
        noStore: true
      });
      query = new QueryAssist(thisUser, cb)
        .wrapFunc('fetchGithubRepos');
    } else {
      var githubOrg = thisUser.newGithubOrg(build.attrs.owner.username);
      data.selectedRepos = data.selectedRepos || githubOrg.newGithubRepos([], {
        noStore: true
      });
      query = new QueryAssist(githubOrg, cb)
        .wrapFunc('fetchRepos');
    }
    query
      .query({})
      .cacheFetch(function updateDom(githubRepos, cached, cb) {
        data.githubRepos = githubRepos;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, githubRepos, cb) {
        if (githubRepos) {
          return cb(new Error('GitHub repos not found'));
        }
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

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
        data.openItems.add(files.models);
        $scope.safeApply();
      })
      .go();
  }
}

ControllerSetup.initState = function () {
  return {
    data: {
      isAdvanced: false,
      isRepoMode: false
    },
    actions: {}
  };
};
