'use strict';

require('app')
  .controller('ControllerInstance', ControllerInstance);
/**
 * @ngInject
 */
function ControllerInstance(
  $localStorage,
  $q,
  $scope,
  $state,
  $stateParams,
  $timeout,
  OpenItems,
  errs,
  eventTracking,
  favico,
  fetchCommitData,
  fetchInstances,
  fetchSettings,
  keypather,
  fetchUser,
  pageName,
  promisify,
  setLastInstance,
  loading
) {
  var dataInstance = $scope.dataInstance = {
    data: {
      unsavedAcvs: []
    },
    actions: {}
  };
  var data = dataInstance.data;
  $scope.$storage = $localStorage;
  loading('main', true);

  data.openItems = new OpenItems();

  // shows/hides the file menu
  data.showExplorer = true;
  // loader if saving fs changes
  data.saving = false;

  data.userIsOrg = function () {
    return $scope.user.oauthName() !== $state.params.userName;
  };

  // The error handling for fetchUser will re-direct for us, so we don't need to handle that case
  fetchUser().then(function (user) {
    $scope.user = user;
    // product team - track visits to instance page & referrer
    eventTracking.visitedState();
    return $q.all({
      instance: fetchInstances({ name: $stateParams.instanceName }, true),
      settings: fetchSettings()
    })
      .then(function (results) {
        var instance = results.instance;
        data.instance = instance;
        //
        //
        //
        function getCommitsForContextVersion (instance, contextVersion) {
          var acv = keypather.get(contextVersion, '.appCodeVersions[0]');
          return fetchUser()
            .then(function (user) {
              return promisify($scope.user, 'fetchContext')(keypather.get(instance, 'attrs.contextVersion.context'));
            })
            .then(function (context) {
              return promisify(context, 'fetchVersion')(contextVersion._id);
            })
            .then(function (contextVersion) {
              return promisify(contextVersion, 'fetchAppCodeVersion')(acv._id);
            })
            .then(function (acv) {
              var branch = fetchCommitData.activeBranch(acv);
              return fetchCommitData.branchCommits(branch);
            });
        }

        function getInstanceBuidldsForCommit (instance, branchName) {
          return fetchUser()
            .then(function () {
              return promisify(user, 'fetchContext')(keypather.get(instance, 'attrs.contextVersion.context'));
            })
            .then(function (context) {
              return promisify(context, 'fetchVersions')();
            })
            .then(function (contextVersionCollection) {
              return contextVersionCollection
                .filter(function (model) {
                  var acv = model.attrs.appCodeVersions[0];
                  return acv.branch === branchName;
                })
                .map(function (contextVersion) {
                  return contextVersion.attrs.build;
                })
                .filter(function (build) {
                  return build.started && build.failed !== true;
                })
                .sort(function (a, b) {
                  return a.started > b.started;
                });
            });
        }

        var contextVersion = keypather.get(instance, 'attrs.contextVersion');
        var currentBuild = keypather.get(contextVersion, 'build');
        var acv = keypather.get(contextVersion, 'appCodeVersions[0]');
        var branchName = keypather.get(acv, 'branch');
        var currentCommit = keypather.get(acv, 'commit');
        var isLocked = keypather.get(instance, 'attrs.locked');
        if (!isLocked && acv && branchName) {
          getCommitsForContextVersion(instance, contextVersion)
            .then(function (commits) {
              if (commits[0].sha === currentCommit) {
                console.log('Commit is up to date');
              } else {
                console.log('Commit is NOT up to date', commits[0].sha, currentCommit);
                console.log('Checking builds...');
                getInstanceBuidldsForCommit(instance, branchName, currentCommit)
                .then(function (builds) {
                  console.log('builds for the same branch', builds);
                  console.log('builds built after current build', builds.filter(function (build) {
                    return build.started && build.started > currentBuild.started;
                  }));
                  console.log('non-completed builds built after current build', builds.filter(function (build) {
                    return build.started && build.started > currentBuild.started && !build.completed;
                  }));
                });
              }
            });
        } else {
          console.log('Instance Locked');
        }

        //
        //
        pageName.setTitle(instance.attrs.name);
        data.instance.state = {};

        var goHomeOnDestroyHandler = function () {
          $state.go('base.instances', { userName:  $state.params.userName }, {reload: true});
        };
        instance.on('destroyed', goHomeOnDestroyHandler);
        $scope.$on('$destroy', function () {
          instance.off('destroyed', goHomeOnDestroyHandler);
        });

        data.hasToken = keypather.get(results, 'settings.attrs.notifications.slack.apiToken');
        setLastInstance($stateParams.instanceName);
        loading('main', false);
      })
      .catch(function (err) { // We ONLY want to handle errors related to fetching instances so this catch is nested.
        errs.handler(err);
        loading('main', false);
        setLastInstance(false);
        $state.go('base.instances', {
          userName: $stateParams.userName
        }, {reload: true});
      });
  });

  $scope.$watch('dataInstance.data.instance.backgroundContextVersionFinished', function (n, p) {
    // (n !== p) <- Never open this up the first time you arrive on this page
    var unwatchNewCv = angular.noop;
    if (n && n !== p) {
      unwatchNewCv();
      dataInstance.data.instance.backgroundContextVersionFinished = false;
      // If the build was triggered by me manually we don't want to show toasters.
      var isManual = n.triggeredAction.manual;
      var isTriggeredByMe = n.triggeredBy.github === $scope.user.oauthId();

      if (isManual && isTriggeredByMe) {
        data.showUpdatedMessage = false;
        return;
      }
      if (data.instance.contextVersion.getMainAppCodeVersion()) {
        data.commit = fetchCommitData.activeCommit(
          data.instance.contextVersion.getMainAppCodeVersion(),
          keypather.get(n, 'triggeredAction.appCodeVersion.commit')
        );
        var updateBuildHash = n.hash;
        unwatchNewCv = $scope.$watch(function () {
          return keypather.get($scope, 'dataInstance.data.instance.contextVersion.attrs.build.hash') === updateBuildHash &&
            keypather.get($scope, 'dataInstance.data.instance.containers.models[0].running()');
        }, function (n) {
          if (n) {
            unwatchNewCv();
            data.showUpdatingMessage = false;
            data.showUpdatedMessage = true;
          }
        });
      }
    }
  });

  $scope.$watch('dataInstance.data.instance.backgroundContextVersionBuilding', function (n, p) {
    if (n && n !== p) {
      dataInstance.data.instance.backgroundContextVersionBuilding = false;
      // If the build was triggered by me manually we don't want to show toasters.
      var isManual = n.triggeredAction.manual;
      var isTriggeredByMe = n.triggeredBy.github === $scope.user.oauthId();

      if (isManual && isTriggeredByMe) {
        data.showUpdatingMessage = false;
        return;
      }
      if (data.instance.contextVersion.getMainAppCodeVersion()) {
        data.commit = fetchCommitData.activeCommit(
          data.instance.contextVersion.getMainAppCodeVersion(),
          keypather.get(n, 'triggeredAction.appCodeVersion.commit')
        );
        data.showUpdatedMessage = false;
        data.showUpdatingMessage = true;
      }
    }
  });

  $scope.$watch('dataInstance.data.instance.status()', function (status) {
    if (!status || keypather.get($scope, 'dataInstance.data.instance.isMigrating()')) {
      // If we're migrating, don't change the tabs
      return;
    }
    switch (status) {
      case 'running':
        data.openItems.restoreTabs(
          { instanceId: data.instance.id() },
          data.instance.containers.models[0],
          true
        );
        break;
      case 'crashed':
      case 'stopped':
      case 'starting':
      case 'stopping':
        data.openItems.removeAllButLogs();
        break;
      default:
        data.openItems.removeAllButBuildLogs();
        break;
    }
    $timeout(function () {
      favico.setInstanceState(keypather.get($scope, 'dataInstance.data.instance'));
    });
  });
}
