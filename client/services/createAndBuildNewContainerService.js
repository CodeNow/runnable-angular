'use strict';

require('app')
  .factory('createAndBuildNewContainer', createAndBuildNewContainer);


function createAndBuildNewContainer(
  $q,
  $rootScope,
  createNewInstance,
  eventTracking,
  fetchInstancesByPod,
  fetchUser,
  helpCards
) {
  return function (createPromise, containerName) {
    eventTracking.triggeredBuild(false);
    // Save this in case it changes
    var cachedActiveAccount = $rootScope.dataApp.data.activeAccount;
    return $q.all({
      masterInstances: fetchInstancesByPod(cachedActiveAccount.oauthName()),
      user: fetchUser(),
      newServerModel: createPromise
    })
      .then(function (response) {
        var instance = response.user.newInstance({
          name: containerName,
          owner: {
            username: cachedActiveAccount.oauthName()
          }
        }, { warn: false });
        response.masterInstances.add(instance);

        $rootScope.$broadcast('alert', {
          type: 'success',
          text: 'Your new container is building.'
        });
        helpCards.hideActiveCard();
        return createNewInstance(
          cachedActiveAccount,
          response.newServerModel.build,
          response.newServerModel.opts,
          instance
        )
          .then(function (instance) {
            helpCards.refreshAllCards();
            return instance;
          })
          .catch(function (err) {
            // Remove it from the servers list
            instance.dealloc();
            return $q.reject(err);
          });
      });
  };
}