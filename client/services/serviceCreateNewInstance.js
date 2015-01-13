'use strict';

require('app')
  .factory('createNewInstance', createNewInstance);

function createNewInstance(
  async,
  $state,
  createNewBuild
) {
  return function (activeAccount, appCodeVersions, opts, instances) {
    function buildBuild(build, cb) {
      build.build({
        message: 'Initial Build'
      }, cb);
    }

    function attach(build, cb) {
      opts.owner = {
        github: activeAccount.oauthId()
      };
      opts.build = build.id();
      var instance = instances.create(opts, function (err) {
        cb(err, instance);
      });
    }

    function goToNewInstance(instance) {
      $state.go('instance.instance', {
        userName: activeAccount.oauthName(),
        instanceName: instance.attrs.name
      });
    }

    return function (cb) {
      async.waterfall([
        function (cb) {
          createNewBuild(activeAccount, appCodeVersions, cb);
        },
        buildBuild,
        attach,
        goToNewInstance
      ], cb);
    };
  };
}
