'use strict';

require('app')
  .factory('createAndBuildNewContainer', createAndBuildNewContainer)
  .factory('alertContainerCreated', alertContainerCreated)
  .factory('reportInstanceFailures', reportInstanceFailures);

function alertContainerCreated (
  $q,
  $rootScope,
  fetchPlan
) {
  return function (oldPlanId) {
    if (!oldPlanId) {
      return $q.reject(new Error('No `oldPlanId` supplied'));
    }
    fetchPlan.cache.clear();
    return fetchPlan()
      .then(function (newPlan) {
        $rootScope.$broadcast('alert', {
          type: 'success',
          text: 'Container Created',
          newPlan: newPlan.next.id !== oldPlanId
        });
      });
  };
}

var errorsToNotReport = [
  'instance with lowerName already exists'
];
function reportInstanceFailures(
  report
) {
  return function (err) {
    var errorMessage = err.message;
    if (!errorsToNotReport.includes(errorMessage)) {
      report.critical(err.message, {
        err: err
      });
    }
  };
}

/**
  * Given a `state` object, create a build for the specified context version
  *
  * @param createPromise {Promise} - A promise that returns a `state`object
  * with a `build` and a `opts` property.
  * @param container {String}
  * @return instancePromise {Promise} - Promise that returns a new instance
  */
function createAndBuildNewContainer(
  $q,
  $rootScope,
  alertContainerCreated,
  createNewInstance,
  currentOrg,
  demoFlowService,
  eventTracking,
  errs,
  fetchInstancesByPod,
  fetchPlan,
  fetchUser,
  keypather,
  invitePersonalRunnabot,
  reportInstanceFailures
) {
  return function (createPromiseForState, containerName, options) {
    options = options || {};
    eventTracking.triggeredBuild(false);
    // Save this in case it changes
    var cachedActiveAccount = $rootScope.dataApp.data.activeAccount;
    var instance = null;
    var oldPlanId = null;
    return $q.all({
      masterInstances: fetchInstancesByPod(cachedActiveAccount.oauthName()),
      user: fetchUser()
    })
      .then(function (response) {
        return fetchPlan()
          .then(function (plan) {
            oldPlanId = keypather.get(plan, 'next.id');
          })
          .catch(errs.report) // Report this error, but don't show a popup
          .then(function () {
            return response;
          });
      })
      .then(function (response) {
        var instanceOptions = {
          name: containerName,
          owner: {
            username: cachedActiveAccount.oauthName()
          }
        };
        instance = response.user.newInstance(instanceOptions, {warn: false});
        if (options.isolation) {
          options.isolation.instances.add(instance);
        } else {
          response.masterInstances.add(instance);
        }
        return $q.when(createPromiseForState);
      })
      .then(function (newServerModel) {
        if (options.isolation) {
          newServerModel.opts.isIsolationGroupMaster = false;
          newServerModel.opts.isolated = options.isolation.id();
        }
        if (demoFlowService.isInDemoFlow()) {
          newServerModel.opts = angular.extend(newServerModel.opts, {
            shouldNotAutofork: false
          });
        }
        return createNewInstance(
          cachedActiveAccount,
          newServerModel.build,
          newServerModel.opts,
          instance
        );
      })
      .then(function (instance) {
        // Fire-and-forget, but report any errors
        if (keypather.get(currentOrg, 'poppa.attrs.isPersonalAccount') && keypather.get(currentOrg, 'poppa.attrs.prBotEnabled')) {
          var githubUsername = keypather.get(currentOrg, 'poppa.attrs.name');
          var repoName = instance.getRepoName();
          invitePersonalRunnabot({githubUsername: githubUsername, repoName: repoName});
        }
        alertContainerCreated(oldPlanId);
        return instance;
      })
      .catch(function (err) {
        reportInstanceFailures(err);
        // Remove it from the servers list
        if (instance) {
          instance.dealloc();
        }
        return $q.reject(err);
      });
  };
}