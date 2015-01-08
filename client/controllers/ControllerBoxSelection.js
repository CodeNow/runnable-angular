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
  $scope.repo = $stateParams.repo;
  $scope.branch = $stateParams.branch;
  $scope.message = $stateParams.message;

  // Get list of instances for current user/org that have the repo
  function fetchInstances (cb) {
    $scope.instances = user.fetchInstances({
      githubUsername: $stateParams.userName,
      'contextVersion.appCodeVersions.repo': $stateParams.userName + '/' + $stateParams.repo
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
    fetchInstances
  ], errs.handler);

  function copyCv (instance, cb) {
    console.log(instance.build.contextVersions.models[0]);
    var copiedCv = instance.build.contextVersions.models[0].deepCopy(function (err) {
      if (err) { return errs.handler(err); }
      console.log(copiedCv);
      copiedCv.appCodeVersions.models[0].update({
        repo: $stateParams.userName + '/' + $stateParams.repo,
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
      var name = getNewForkName(instance, $scope.instances);
      console.log(name);
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