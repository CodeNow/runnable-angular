'use strict';

require('app')
  .controller('ControllerInstanceLayout', ControllerInstanceLayout);
/**
 * @ngInject
 */
function ControllerInstanceLayout(
  configLogoutURL,
  fetchInstances,
  $rootScope,
  keypather,
  $scope,
  $state,
  $window,
  pFetchUser
) {

  var currentUser;
  pFetchUser().then(function(user) {
    currentUser = user;
  });

  var dataInstanceLayout = $scope.dataInstanceLayout = {
    data: {},
    state: {},
    actions: {}
  };
  dataInstanceLayout.data.logoutURL = configLogoutURL();
  var unwatch = $scope.$watch('dataApp.data.activeAccount.oauthName()', function (n) {
    if (!n) { return; }
    unwatch();
    resolveInstanceFetch(n);
  });

  keypather.set($scope, 'dataApp.actions.setToggled', function (teamMember) {
    if (teamMember.toggled && !teamMember.hasCurrentInstance) {
      teamMember.toggled = false;
      return;
    }
    $scope.dataApp.data.instanceGroups.teamMembers.forEach(function (tm) {
      if (!tm.hasCurrentInstance) {
        tm.toggled = false;
      }
    });
    teamMember.toggled = true;
  });

  function sortInstancesByCreator(instances) {
    // Object for the first step so we can apply instances to already-found people
    var instanceMap = {};
    instances.forEach(function (instance) {
      // Special-case current user
      var username = instance.attrs.createdBy.username === currentUser.oauthName() ?
          'me' : instance.attrs.createdBy.username;

      // Add team member to instanceMap if we haven't found them yet
      if (!instanceMap[username]) {
        instanceMap[username] = angular.copy(instance.attrs.createdBy);
        instanceMap[username].instances = [];
      }

      // Set teamMember/instance to active if it's the current one
      if (instance.attrs.name === $state.params.instanceName) {
        instanceMap[username].toggled = true;
        instanceMap[username].hasCurrentInstance = true;
        instance.state = {
          toggled: true
        };
      }

      // Set the "Owned by team member" icon under current user's deps
      if (username === 'me' && $state.params.userName !== currentUser.oauthName()) {
        instance.dependencies.forEach(function(dep) {
          dep.state = {
            ownedByOther: dep.createdBy !== currentUser.oauthId()
          };
        });
      }

      // Add the instance to the map
      instanceMap[username].instances.push(instance);
    });

    // Convert the map to an Array so it's easier to work with in the view
    var teamMembers = [];
    Object.keys(instanceMap).forEach(function(key) {
      if (key !== 'me') {
        teamMembers.push(instanceMap[key]);
      }
    });

    return {
      teamMembers: teamMembers,
      me: instanceMap.me
    };
  }

  function resolveInstanceFetch(username) {
    if (!username) { return; }
    keypather.set($rootScope, 'dataApp.state.loadingInstances', true);
    keypather.set($rootScope, 'dataApp.data.instances', null);
    fetchInstances({
      githubUsername: username
    }).then(function (instances) {
      $scope.$watch(function() {
        return instances.models.length;
      }, function (n) {
        if (n === undefined) { return; }
        if (n === 0) {
          $scope.dataApp.data.instanceGroups = [];
          return;
        }
        $scope.dataApp.data.instanceGroups = sortInstancesByCreator(instances);
      });

      if (instances.githubUsername === keypather.get($rootScope, 'dataApp.data.activeAccount.oauthName()')) {
        keypather.set($rootScope, 'dataApp.state.loadingInstances', false);
        keypather.set($rootScope, 'dataApp.data.instances', instances);
      }
    });
  }

  var instanceListUnwatcher = $scope.$on('INSTANCE_LIST_FETCH', function (event, username) {
    resolveInstanceFetch(username);
  });

  $scope.$on('$destroy', function () {
    instanceListUnwatcher();
  });

}
