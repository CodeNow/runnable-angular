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
  $window,
  $timeout,
  $localStorage,
  promisify,
  errs,
  fetchUser,
  fetchInstancesByPod,
  loading,
  configEnvironment
) {
  var CIL = this;
  CIL.data = {};

  CIL.$localStorage = $localStorage;

  fetchUser().then(function(user) {
    CIL.currentUser = user;
    resolveInstanceFetch($state.params.userName);
  });

  if (configEnvironment !== 'production') {
    CIL.data.inDev = true;
  }

  function resolveInstanceFetch(username) {
    if (!username) { return; }
    loading('sidebar', true);
    CIL.instancesByPod = [];
    console.log(username);
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

  // Account Selection popover
  CIL.popoverAccountMenu = {
    actions: {
      logout: function () {
        promisify(CIL.user, 'logout')().then(function () {
          $window.location = '/?password';
        }).catch(errs.handler);
      },
      selectActiveAccount: function (userOrOrg) {
        var username = userOrOrg.oauthName();
        $rootScope.$broadcast('close-popovers');
        $timeout(function () {
          $state.go('^.home', {
            userName: username
          }).then(function () {
            $rootScope.dataApp.data.activeAccount = userOrOrg;
            resolveInstanceFetch(username);
            // CIL.popoverAccountMenu.data.activeAccount = account;
            // CIL.popoverAccountMenu.data.orgs $scope.data.orgs;
            // CIL.popoverAccountMenu.data.user = CIL.data.user;

            // Integrations modal
            CIL.popoverAccountMenu.data.showIntegrations = CIL.currentUser.oauthName() !== $state.params.userName;
          });
        });
      }
    },
    data: CIL.data,
    state: {
      active: false
    }
  };

  CIL.dataModalIntegrations = CIL.data;
}
