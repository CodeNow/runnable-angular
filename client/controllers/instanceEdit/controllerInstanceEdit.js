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
  $interval,
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
    showPopoverFileMenuAddRepo: false,
    showPopoverRepoMenu: false,
    buildName: $stateParams.buildName,
    showExplorer: false
  };

  /*********************************
  * popoverGearMenu
  *********************************/
  var pgm = data.popoverGearMenu = {};
  pgm.data = {
    show: false,
    // popover contains nested modal
    dataModalDelete: {},
    dataModalRename: {}
  };
  pgm.actions = {
    // popover contains nested modal
    actionsModalDelete: {
      deleteInstance: function () {
        data.instance.destroy(function (err) {
          if (err) {
            throw err;
          }
          $state.go('home');
        });
      }
    },
    actionsModalRename: {
      renameInstance: function (cb) {
        data.instance.update({
          name: data.instance.attrs.name
        }, function (err) {
          $scope.safeApply();
          cb();
          if (err) {
            throw err;
          }
        });
        $scope.safeApply();
      }
    },
    forkInstance: function () {
      var newInstance = data.instance.copy(function (err) {
        if (err) {
          throw err;
        }
        $state.go('instance.instance', {
          userName: $stateParams.userName,
          shortHash: newInstance.attrs.shortHash
        });
        // refetch instance collection to update list in
        // instance layout
        var oauthId = $scope.dataInstanceLayout.data.activeAccount.oauthId();
        new QueryAssist($scope.dataApp.user, function () {
          $scope.safeApply();
        })
        .wrapFunc('fetchInstances')
        .query({
          owner: {
            github: oauthId
          }
        })
        .cacheFetch(function (instances, cached, cb) {
          cb();
        })
        .resolve(angular.noop)
        .go();
      });
    }
  };

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
      message: 'Manual build'
    };
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
        data.openItems && !data.openItems.isClean() && // Files have been edited and not saved
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
        pgm.data.dataModalRename.instance = instance;
        pgm.data.dataModalDelete.instance = instance;
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
        if (build.id() !== $state.params.buildId) {
          throw new Error('Incorrect build loaded');
        }
        if (build.attrs.started) {
          $state.go('instance.instance', $state.params);
        }
        data.build = build;
        data.version = data.build.contextVersions.models[0];

        pgm.data.build = data.build;
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
      $interval.cancel(interval);
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
      interval = $interval(openDockerfile, 500);
    }
    $scope.safeApply();
  });

  $scope.$on('$destroy', function () {
    $interval.cancel(interval);
  });
}