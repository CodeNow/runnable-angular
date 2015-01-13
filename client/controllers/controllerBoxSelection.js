'use strict';

require('app')
  .controller('ControllerBoxSelection', boxSelection);

function boxSelection (
  async,
  errs,
  fetchUser,
  getNewForkName,
  $scope,
  $state,
  $stateParams,
  user
) {
  // Get build
  // Get list of instances for current user/org
  function fetchBuild (cb) {
    $scope.build = user.fetchBuild($stateParams.buildId, function (err) {
      if (err) { return cb(err); }
      if (!$scope.build.contextVersions.models.length) {
        return cb(new Error('Could not find contextVersions'));
      }

      $scope.build.contextVersions.models[0].fetch(function (err) {
        // todo
      });
    });
  }

  function fetchInstances (cb) {
    $scope.instances = user.fetchInstances({
      githubUsername: $stateParams.userName
    }, cb);
  }

  async.parallel([
    function (cb) {
      fetchUser(function (err, user) {
        if (err) { return cb(err); }
        $scope.user = user;
        cb();
      });
    },
    fetchBuild,
    fetchInstances
  ], errs.handler);

  $scope.fork = function(instance) {
    var name = getNewForkName(instance, $scope.instances);
    console.log(name);
    instance.copy({
      build: $scope.build.id(),
      name: name
    }, function(err) {
      if (err) { return errs.handler(err); }
      $state.go('instance.instance', {
        userName: $stateParams.userName,
        instanceName: name
      });
    });
  };
  $scope.overwrite = function (instance) {
    // Set instance's build to this one.
    instance.update({
      build: $scope.build.id()
    }, function (err) {
      if (err) { return errs.handler(err); }
      // Go to that page.
      $state.go('instance.instance', {
        userName: $stateParams.userName,
        instanceName: instance.attrs.name
      });
    });
  };
}