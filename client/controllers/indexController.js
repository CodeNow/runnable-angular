'use strict';

require('app')
  .controller('IndexController', IndexController);

function IndexController(
  $localStorage,
  $ocLazyLoad,
  $rootScope,
  $scope,
  $state,
  $timeout,
  $window,
  configAPIHost,
  configEnvironment,
  configLoginURL,
  debounce,
  errs,
  featureFlags
) {
  // Load ace after 5 seconds. Should improve user experience overall..
  $timeout(function () {
    $ocLazyLoad.load('ui.ace');
  }, 10000);

  var dataApp = $rootScope.dataApp = $scope.dataApp = {
    data: {
      instances: null,
      configAPIHost: configAPIHost,
      minimizeNav: false,
      loginURL: configLoginURL(),
      modalError: {
        data: {},
        actions: {
          close: function () {
            errs.clearErrors();
            dataApp.data.modalError.data.in = false;
          }
        }
      },
      // used in dev-info box
      configEnvironment: configEnvironment
    },
    actions: {},
    state: $state
  };


  var w = angular.element($window);
  w.bind('resize', debounce(function () {
    $timeout(angular.noop);
  }, 33));

  $rootScope.featureFlags = featureFlags.flags;
  $rootScope.resetFeatureFlags = featureFlags.reset;

  $scope.$watch(function () {
    return errs.errors.length;
  }, function(n) {
    if (n) {
      dataApp.data.modalError.data.errors = errs.errors;
      dataApp.data.modalError.data.in = true;
    }
  });

  $rootScope.canEditFeatureFlags = function () {
    return !!dataApp.data.allAccounts.find(function (account) {
      return account.oauthName() === 'CodeNow';
    });
  };


}
