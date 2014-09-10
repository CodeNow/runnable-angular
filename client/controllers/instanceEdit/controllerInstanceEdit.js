require('app')
  .controller('ControllerInstanceEdit', ControllerInstanceEdit);
/**
 * @ngInject
 */
function ControllerInstanceEdit(
  $scope,
  $stateParams,
  $state,
  $window,
  user,
  async,
  extendDeep,
  OpenItems,
  keypather,
  fetcherBuild
) {
  var QueryAssist = $scope.UTIL.QueryAssist;
  var holdUntilAuth = $scope.UTIL.holdUntilAuth;
  var self = ControllerInstanceEdit;
  var dataInstanceEdit = $scope.dataInstanceEdit = {};

  var actions = dataInstanceEdit.actions = {};
  var data = dataInstanceEdit.data = {
    showPopoverFileMenu: false,
    showPopoverFileMenuForm: false,
    showPopoverFileMenuAddReop: false,
    showPopoverRepoMenu: false,
    buildName: $stateParams.buildName,
    showExplorer: false
  };

  /***************************************
   * Rebuild Popover
   **************************************/
  var rbpo = dataInstanceEdit.data.rbpo = {};
  rbpo.data = {};
  rbpo.actions = {};

  rbpo.data.show = false;
  rbpo.data.environmentName = '';
  rbpo.data.buildMessage = '';
  rbpo.data.popoverInputHasBeenClicked = false;

  function setupBuildPopover () {
    rbpo.data.project = dataInstanceEdit.data.project;
  }

  rbpo.actions.build = function () {
    data.build.build({
      message: 'Manual build'
    }, function (err) {
      if (err) {
        throw err;
      }
      data.instance.update({
        build: data.build.id()
      }, function (err) {
        if (err) {
          throw err;
        }
        // Display build logs
      });
    });
  };

  rbpo.actions.getPopoverButtonText = function (name) {
    return 'Build' + ((name && name.length) ? 's in ' + name : '');
  };

  rbpo.actions.resetInputModelValue = function ($event) {
    if (!rbpo.data.popoverInputHasBeenClicked) {
      return;
    }
    rbpo.data.environmentName = '';
    rbpo.data.popoverInputHasBeenClicked = true;
  };

  /**************************************/


  actions.goToInstance = function (skipCheck) {
    if (skipCheck) {
      data.skipCheck = true;
    }
    $state.go('instance.instance', $state.params);
  };

  actions.createRepo = function () {
    var version = dataInstanceEdit.data.version;
    var repo = version.addGithubRepo({
      repo: 'cflynn07/dotfiles'
    }, function (err, res) {
      version.fetch(function () {
        $scope.safeApply();
      });
    });
  };

  actions.build = function () {
    $scope.dataApp.data.loading = true;
    var buildObj = {
      message: (rbpo.data.buildMessage || 'Manual build')
    };
    if (data.forkedEnvironment) {
      buildObj.environment = data.forkedEnvironment.id();
      buildObj.parentBuild = data.build.id();
      var forkedBuild = data.forkedEnvironment.createBuild(buildObj,
        function (err) {
          if (err) throw err;

          forkedBuild.build({
            message: buildObj.message
          }, function (err) {
            $scope.dataApp.data.loading = false;
            if (err) throw err;

            $state.go('projects.build', angular.copy({
              buildName: forkedBuild.attrs.buildNumber,
              branchName: data.forkedEnvironment.attrs.name
            }, $stateParams));
          });
        });
    } else {
      data.build.build(buildObj,
        function (err, build) {
          if (err) throw err;
          data.instance.update({
            build: data.build.id()
          }, function (err) {
            if (err) {
              throw err;
            }
            $scope.dataApp.data.loading = false;
            $state.go('instance.instance', $stateParams);
          });
        });
    }
  };

  actions.edit = function () {
    var newBuild = dataInstanceEdit.data.build.fork(function (err, build, code) {
      if (err) {
        throw err;
      }
      var sp = angular.copy($stateParams);
      sp.newBuildName = newBuild.id();
      $state.go('projects.buildNew', sp);
    });
  };

  actions.getTitle = function () {
    if (data.instance) {
     return data.instance.attrs.name + ' @ build #' + data.build.attrs.buildNumber;
    }
    return '';
  };

  /**
   * If this build is built, we want to wait for changes and then trigger a fork
   */
  $scope.$watch('dataInstanceEdit.data.openFiles.activeFile.attrs.body', function (newval, oldval) {
    var started = keypather.get(dataInstanceEdit.data, 'build.attrs.started');
    if (!started || (typeof started === 'string' && !started.length)) {
      return;
    }
    if (oldval === undefined || (newval === oldval)) {
      return;
    }
    dataInstanceEdit.actions.forkBuild();
  });

  $scope.$watch('dataInstanceEdit.data.build.attrs.completed', function(n) {
    if (n) {
      data.showExplorer = true;
    }
  });

  var confirmText = 'You\'ve made unsaved changes to this page.';

  $window.onbeforeunload = function () {
    if (!data.openItems.isClean()) {
      return confirmText;
    }
  };

  $scope.$on('$stateChangeStart', function (e, n, c) {
    if (!data.skipCheck &&
        n.url !== '^/:userName/:shortHash/edit/:buildId/' && // We're leaving the edit page
        !data.openItems.isClean() && // Files have been edited and not saved
        !confirm(confirmText + '\nAre you sure you want to leave?')) {
      e.preventDefault();
    } else {
      $window.onbeforeunload = null;
    }
  });

  /*
  $scope.$watch('dataInstanceEdit.data.openFiles.activeFile.attrs._id', function (newval, oldval) {
    if (newval === oldval) {
      // We've opened the same file
      return;
    }
    var file = dataInstanceEdit.data.openFiles.activeFile;
    var version = dataInstanceEdit.data.version;
    file = version.fetchFile(file.id(), function () {
      $scope.safeApply();
    });
  });
*/

  /* ============================
   *   API Fetch Methods
   * ===========================*/

  function fetchInstance(cb) {
    var thisUser = $scope.dataApp.user;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchInstance')
      .query($stateParams.shortHash)
      .cacheFetch(function updateDom(instance, cached, cb) {
        if (!instance) {
          return;
          // TODO
          // return $state.go(404);
        }
        data.instance = instance;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, instance, cb) {
        if (!keypather.get(instance, 'containers.models') || !instance.containers.models.length) {
          return cb(new Error('Instance not found'));
        }
        $scope.safeApply();
        cb(err);
      })
      .go();
  }

  function fetchBuild(cb) {
    var thisUser = $scope.dataApp.user;
    var id = $state.params.buildId;
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchBuild')
      .query(id)
      .cacheFetch (function updateDom(build, cached, cb) {
        if (!build) {
          return;
          // Also 404
        }
        data.build = build;
        data.version = data.build.contextVersions.models[0];
        if (data.build) {
          data.showExplorer = true;
        } else {
          data.showExplorer = false;
        }
        cb();
      })
      .resolve(function (err, build, cb) {
        cb(err);
      })
      .go();
  }

  function newOpenItems(cb) {
    data.openItems = new OpenItems();
    if (data.build.attrs.started) {
      data
        .openItems.addBuildStream({
          name: 'Build Stream'
        })
        .state.alwaysOpen = true;
    }
    $scope.safeApply();
    cb();
  }

  var interval;
  function openDockerfile () {
    var dockerfile = data.version.rootDir.contents.find(function (m) {
      return m.attrs.name === 'Dockerfile';
    });
    if (dockerfile) {
      data.openItems.addOne(dockerfile);
      clearInterval(interval);
    }
    return !!dockerfile;
  }

  async.waterfall([
    holdUntilAuth,
    fetchInstance,
    fetchBuild,
    newOpenItems
  ], function (err) {
    if (err) {
      // $state.go('404');
      throw err;
    }
    if (!openDockerfile()) {
      // Continue checking until it's loaded
      interval = setInterval(openDockerfile, 500);
    }
    $scope.safeApply();
  });
}