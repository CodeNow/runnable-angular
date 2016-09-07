'use strict';

require('app')
  .factory('createAndBuildNewContainer', createAndBuildNewContainer);


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
  createNewInstance,
  eventTracking,
  fetchInstancesByPod,
  fetchPlan,
  fetchUser
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
      user: fetchUser(),
      plan: fetchPlan()
    })
      .then(function (response) {
        oldPlanId = response.plan.next.id;
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
        fetchPlan.cache.clear();
        return fetchPlan()
          .then(function (newPlan) {
            $rootScope.$broadcast('alert', {
              type: 'success',
              text: 'Container Created',
              newPlan: newPlan.next.id !== oldPlanId
            });
          })
          .then(function () {
            return instance;
          });
      })
      .then(function (instance) {
        return instance;
      })
      .catch(function (err) {
        // Remove it from the servers list
        instance.dealloc();
        return $q.reject(err);
      });
  };
}
