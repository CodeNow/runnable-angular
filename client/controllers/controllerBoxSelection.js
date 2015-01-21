'use strict';

require('app')
  .controller('ControllerBoxSelection', boxSelection);

function boxSelection (
  async,
  errs,
  fetchUser,
  getNewForkName,
  $window,
  $location,
  $scope,
  $state,
  $stateParams,
  user
) {
  $scope.repo = $stateParams.repo;
  $scope.branch = $stateParams.branch;
  $scope.message = $stateParams.message;

  var fullRepoName = $scope.fullRepoName = $stateParams.userName + '/' + $stateParams.repo;

  // Trigger Heap event
  if ($window.heap && $location.search('chat')) {
    $window.heap.track('box-selection-chat-click', {
      type: $location.search('chat')
    });
    // Remove query so copypasta doesn't interfere
    $location.search('chat', null);
  }

  // Get list of instances for current user/org that have the repo
  function fetchRepoInstances (cb) {
    $scope.instances = user.fetchInstances({
      githubUsername: $stateParams.userName,
      'contextVersion.appCodeVersions.repo': fullRepoName
    }, cb);
  }

  // Fetches all instances for dupe name checking
  // Naming will be replaced with API route in the future
  var allInstances;
  function fetchInstances (cb) {
    allInstances = user.fetchInstances({
      githubUsername: $stateParams.userName
    }, function (err) {
      if (err) { return errs.handler(err); }
      $scope.loading = false;
    });
  }
  $scope.loading = true;
  fetchUser(function (err, user) {
    if (err) { return errs.handler(err); }
    $scope.user = user;
    async.parallel([
      fetchRepoInstances,
      fetchInstances
    ], errs.handler);
  });

  function copyCv (instance, cb) {
    $scope.loading = true;
    var copiedCv = instance.build.contextVersions.models[0].deepCopy(function (err) {
      if (err) { return errs.handler(err); }
      copiedCv.appCodeVersions.models[0].update({
        repo: fullRepoName,
        branch: $stateParams.branch,
        commit: $stateParams.commit
      }, function (err) {
        if (err) { return errs.handler(err); }
        var buildBody = {
          contextVersions: [copiedCv.id()],
          owner: instance.attrs.owner
        };
        var build = user.createBuild(buildBody, function (err) {
          if (err) { return errs.handler(err); }
          build.build(function (err) {
            if (err) { return errs.handler(err); }
            cb(build);
          });
        });
      });
    });
  }

  $scope.fork = function(instance) {
    copyCv(instance, function (build) {
      var name = getNewForkName(instance, allInstances);
      instance.copy({
        build: build.id(),
        name: name
      }, function(err) {
        if (err) { return errs.handler(err); }
        $state.go('instance.instance', {
          userName: $stateParams.userName,
          instanceName: name
        });
      });
    });
  };
  $scope.overwrite = function (instance) {
    copyCv(instance, function(build) {
      // Set instance's build to this one.
      instance.update({
        build: build.id()
      }, function (err) {
        if (err) { return errs.handler(err); }
        // Go to that page.
        $state.go('instance.instance', {
          userName: $stateParams.userName,
          instanceName: instance.attrs.name
        });
      });
    });
  };
}