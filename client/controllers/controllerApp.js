'use strict';

require('app')
  .controller('ControllerApp', ControllerApp);
/**
 * ControllerApp
 * @constructor
 * @export
 * @ngInject
 */
function ControllerApp(
  $scope,
  $rootScope,
  $window,
  debounce,
  configAPIHost,
  configEnvironment,
  configLoginURL,
  configLogoutURL,
  errs,
  fetchUser,
  fetchOrgs,
  pageName,
  keypather,
  $state,
  $timeout
) {

  var dataApp = $rootScope.dataApp = $scope.dataApp = {
    data: {},
    actions: {},
    state: {}
  };
  $rootScope.pageName = pageName;

  var w = angular.element($window);
  w.bind('resize', debounce(function () {
    $timeout(angular.noop);
  }, 33));

  // used in dev-info box
  dataApp.data.configEnvironment = configEnvironment;
  dataApp.data.configAPIHost = configAPIHost;
  dataApp.data.minimizeNav = false;
  dataApp.data.loginURL = configLoginURL();
  dataApp.data.logoutURL = configLogoutURL();

  dataApp.state = $state;

  dataApp.data.modalError = {
    data: {},
    actions: {
      close: function (cb) {
        errs.clearErrors();
        if (typeof cb === 'function') {
          cb();
        }
      }
    }
  };
  function setActiveAccount(accountName) {
    if (accountName) {
      var unwatch = $scope.$watch('dataApp.data.orgs', function(n) {
        if (n) {
          unwatch();
          dataApp.data.instances = null;
          var accounts = [thisUser].concat(n.models);
          dataApp.data.activeAccount = accounts.find(function (org) {
            return (keypather.get(org, 'oauthName().toLowerCase()') === accountName.toLowerCase());
          });
          if (!dataApp.data.activeAccount) {
            dataApp.data.activeAccount = thisUser;
          }
          $rootScope.$broadcast('INSTANCE_LIST_FETCH', dataApp.data.activeAccount.oauthName());
        }
      });
    }
  }
  // shows spinner overlay
  dataApp.data.loading = false;
  $scope.$on('$stateChangeStart', function (event, toState, toParams, fromState, fromParams, error) {
    if (!keypather.get(dataApp, 'data.activeAccount.oauthName()') ||
        toParams.userName !== dataApp.data.activeAccount.oauthName()) {
      setActiveAccount(toParams.userName);
    }
    if ($window.Intercom) {
      $window.Intercom('update');
    }
    dataApp.data.loading = false;
  });

  var thisUser;

  $scope.$watch(function () {
    return errs.errors.length;
  }, function(n) {
    if (n) {
      dataApp.data.modalError.data.errors = errs.errors;
      dataApp.data.modalError.data.in = true;
    }
  });

  /**
   * broadcast to child scopes when click event propagates up
   * to top level controller scope.
   * Used to detect click events outside of any child element scope
   */
  dataApp.documentClickEventHandler = function () {
    $scope.$broadcast('app-document-click');
  };

  dataApp.documentKeydownEventHandler = function(e) {
    if (e.keyCode === 27) {
      $rootScope.$broadcast('app-document-click');
    }
  };

  fetchUser(function(err, results) {
    if (!err && results) {
      thisUser = results;
      dataApp.data.user = results;
      fetchOrgs(function (err, results) {
        if (err) {
          return errs.handler(err);
        }
        dataApp.data.orgs = results;
        if ($window.heap) {
          $window.heap.identify({
            // unique heap user identifier
            // we use githubId with prefix
            handle: 'github-' + thisUser.oauthId(),
            name:  thisUser.oauthName(),
            email: thisUser.attrs.email,
            runnableId: thisUser.id(),
            orgs:  $window.JSON.stringify(results)
          });
        }
        if ($window.Intercom) {
          $window.Intercom('boot', {
            name: thisUser.oauthName(),
            email: thisUser.attrs.email,
            // Convert ISO8601 to Unix timestamp
            created_at: +(new Date(thisUser.attrs.created)),
            app_id: 'wqzm3rju'
          });
        }
        if ($window.olark) {
          $window.olark('api.visitor.updateEmailAddress', { emailAddress: thisUser.attrs.email });
          $window.olark('api.visitor.updateFullName', { fullName: thisUser.oauthName() });
          $window.olark('api.box.show');
        }
      });
    } else {
      return errs.handler(err);
    }
  });
}
