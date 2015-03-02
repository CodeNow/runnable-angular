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

  var currentUserName;
  pFetchUser().then(function(user) {
    currentUserName = user.oauthName();
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

  $scope.dataApp.actions.setToggled = function(teamMember) {
    if (teamMember.toggled) {
      teamMember.toggled = false;
      return;
    }
    $scope.dataApp.data.instanceGroups.teamMembers.forEach(function(tm) {
      tm.toggled = false;
    });
    teamMember.toggled = true;
  };

  function sortInstancesByCreator (instances) {
    // Object for the first step so we can apply instances to already-found people
    var instanceMap = {};
    instances.forEach(function(instance) {
      var username = instance.attrs.createdBy.username === currentUserName ? 'me' : instance.attrs.createdBy.username;
      if (!instanceMap[username]) {
        instanceMap[username] = angular.copy(instance.attrs.createdBy);
        instanceMap[username].instances = [];
      }
      if (instance.attrs.name === $state.params.instanceName) {
        instanceMap[username].toggled = true;
        instance.state = {
          toggled: true
        };
      }
      instanceMap[username].instances.push(instance);
    });
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
        if (!n) { return; }
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
