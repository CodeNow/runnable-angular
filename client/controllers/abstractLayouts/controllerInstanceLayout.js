'use strict';

require('app')
  .controller('ControllerInstanceLayout', ControllerInstanceLayout);
/**
 * @ngInject
 */
function ControllerInstanceLayout(
  $rootScope,
  $scope,
  $state,
  errs,
  fetchUser,
  fetchInstancesByPod,
  loading
) {
  var CIL = this;

  CIL.isLoading = $rootScope.isLoading;

  fetchUser().then(function(user) {
    CIL.currentUser = user;
    resolveInstanceFetch(user.oauthName());
  });

  function resolveInstanceFetch(username) {
    if (!username) { return; }
    loading('sidebar', true);
    CIL.instancesByPod = [];

    fetchInstancesByPod(username)
      .then(function (instancesByPod) {
        loading('sidebar', false);

        // Ensure username hasn't changed since we were called
        if (instancesByPod.githubUsername === $state.params.userName) {
          CIL.instancesByPod = instancesByPod;
        }
      })
      .catch(errs.handler);
  }

  $scope.$on('INSTANCE_LIST_FETCH', function (event, username) {
    resolveInstanceFetch(username);
  });
}
