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
  async,
  determineActiveAccount,
  $scope,
  $state,
  $stateParams,
  keypather,
  hasKeypaths,
  OpenItems,
  user,
  validateDockerfile,
  QueryAssist
) {

  var dataSetup = $scope.dataSetup = {
    data: {},
    actions: {}
  };
  var data = dataSetup.data;

  data.openItems = new OpenItems();
  data.showExplorer = false;
  data.loading = false;

  // Redirect to /new if this build has already been built
  function fetchUser(cb) {
    new QueryAssist(user, cb)
      .wrapFunc('fetchUser')
      .query('me')
      .cacheFetch(function (user, cached, cb) {
        $scope.user = user;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, user, cb) {
        if (err) throw err;
        cb();
      })
      .go();
  }

  function fetchBuild(cb) {
    new QueryAssist($scope.user, cb)
      .wrapFunc('fetchBuild')
      .query($stateParams.buildId)
      .cacheFetch(function (build, cached, cb) {
        if (keypather.get(build, 'attrs.started')) {
          // this build has been built.
          // redirect to new?
          $state.go('instance.new', {
            userName: $scope.activeAccount.oauthId()
          });
          cb(new Error('build already built'));
        } else {
          $scope.build = build;
          $scope.safeApply();
          cb();
        }
      })
      .resolve(function (err, build, cb) {
        if (err) throw err;
        $scope.safeApply();
        cb();
      })
      .go();
  }

  async.waterfall([
    determineActiveAccount,
    function (activeAccount, cb) {
      $scope.activeAccount = activeAccount;
      $scope.safeApply();
      cb();
    },
    fetchUser,
    fetchBuild
  ]);

  /*

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
  */

}
