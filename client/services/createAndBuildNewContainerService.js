'use strict';

require('app')
  .factory('createAndBuildNewContainer', createAndBuildNewContainer)
  .factory('alertContainerCreated', alertContainerCreated);

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
  eventTracking,
  errs,
  fetchInstancesByPod,
  fetchPlan,
  fetchUser,
  keypather
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
        return createNewInstance(
          cachedActiveAccount,
          newServerModel.build,
          newServerModel.opts,
          instance
        );
      })
      .then(function (instance) {
        if (oldPlanId) {
          // Fire-and-forget
          alertContainerCreated(oldPlanId);
        }
        return instance;
      })
      .catch(function (err) {
        // Remove it from the servers list
        if (instance) {
          instance.dealloc();
        }
        return $q.reject(err);
      });
  };
}
