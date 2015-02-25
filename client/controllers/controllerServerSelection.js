'use strict';

require('app')
  .controller('ControllerServerSelection', serverSelection);

function serverSelection (
  errs,
  getNewForkName,
  $window,
  $location,
  $scope,
  $state,
  $stateParams,
  $q,
  user,
  fetchInstances
) {
  var searchObject = $location.search();
  $scope.repo = $stateParams.repo;
  $scope.branch = searchObject.branch;
  $scope.message = searchObject.message;

  var fullRepoName = $scope.fullRepoName = $stateParams.userName + '/' + $stateParams.repo;

  // Trigger Heap event
  if ($window.heap && $location.search().chat) {
    $window.heap.track('box-selection-chat-click', {
      type: $location.search().chat
    });
    // Remove query so copypasta doesn't interfere
    $location.search('chat', '');
  }

  // Get list of instances for current user/org that have the repo
  function fetchRepoInstances () {
    return fetchInstances({
      githubUsername: $stateParams.userName,
      'contextVersion.appCodeVersions.repo': fullRepoName
    }).then(function(instances) {
      $scope.instances = instances;
    });
  }

  // Fetches all instances for dupe name checking
  // Naming will be replaced with API route in the future
  var allInstances;
  function fetchAllInstances () {
    return fetchInstances({
      githubUsername: $stateParams.userName
    }).then(function(instances) {
      allInstances = instances;
    });
  }
  $scope.loading = true;

  $q.all([
    fetchRepoInstances(),
    fetchAllInstances()
  ]).catch(
    errs.handler
  ).finally(function () {
    $scope.loading = false;
  });

  function copyCv (instance, cb) {
    $scope.loading = true;
    var copiedCv = instance.build.contextVersions.models[0].deepCopy(function (err) {
      if (err) { return errs.handler(err); }
      copiedCv.appCodeVersions.models[0].update({
        repo: fullRepoName,
        branch: searchObject.branch,
        commit: searchObject.commit
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