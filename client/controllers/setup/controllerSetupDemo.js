'use strict';

require('app')
  .controller('ControllerSetupDemo', controllerSetupDemo);

function controllerSetupDemo (
  $log,
  $scope,
  $state,
  async,
  QueryAssist,
  user
) {
  $scope.dataApp.data.loading = true;

  var _user, _instance;
  // Fetch user's instances
  function fetchUser(cb) {
    new QueryAssist(user, cb)
      .wrapFunc('fetchUser')
      .query('me')
      .cacheFetch(function (user, cached, cb) {
        _user = user;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, user, cb) {
        if (err) { return $log.error(err); }
        cb(err);
      })
      .go();
  }

  function fetchInstances(cb) {
    new QueryAssist(_user, cb)
      .wrapFunc('fetchInstances', cb)
      .query({
        githubUsername: _user.oauthName()
      })
      .cacheFetch(function (instances, cached, cb) {
        if (!cached && instances.models.length === 0) {
          return cb(new Error('instance not found'));
        }
        _instance = instances.models[0];
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, instances, cb) {
        if (err) { return $log.error(err); }
        cb(err);
      })
      .go();
  }

  function forkBuild (cb) {
    // Fork build of the only one they'll have
    var forkedBuild = _instance.build.deepCopy(function(err) {
      if (err) {
        $log.error(err);
        throw err;
      }

      // Direct them to demoEdit
      $state.go('demo.edit', {
        userName: _user.oauthName(),
        instanceName: _instance.attrs.name,
        buildId: forkedBuild.id()
      });
    });
  }

  async.series([
    fetchUser,
    fetchInstances,
    forkBuild
  ], function(err) {
    if (err) { throw err; }
  });

}