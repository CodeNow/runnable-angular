'use strict';

require('app')
  .controller('ControllerSetup', ControllerSetup);
/**
 * ControllerSetup
 * @param $scope
 * @constructor
 * @export
 * @ngInject
 */
function ControllerSetup(
  async,
  determineActiveAccount,
  $scope,
  $rootScope,
  $state,
  $stateParams,
  keypather,
  errs,
  OpenItems,
  user,
  QueryAssist,
  fetchUser,
  $window
) {

  var dataSetup = $scope.dataSetup = {
    data: {
      instanceOpts: {},
      unsavedAcvs: []
    },
    actions: {}
  };
  var data = dataSetup.data;

  dataSetup.actions.olarkShrink = function() {
    if (angular.isFunction($window.olark)) {
      $window.olark('api.box.shrink');
    }
  };

  $scope.$watch('dataSetup.data.build.contextVersions.models[0].source', function(n, p) {
    if (n && dataSetup.data.showVideo) {
      dataSetup.data.showVideoFixed = true;
    }
    if (n && !p && data.showVideo) {
      // first time user has selected a seed dockerfile, minimize olark if video is playing
      //
      dataSetup.actions.olarkShrink();
    }
  });

  data.openItems = new OpenItems();
  data.showExplorer = false;
  data.loading = false;

  function fetchBuild(cb) {
    new QueryAssist(data.user, cb)
      .wrapFunc('fetchBuild')
      .query($stateParams.buildId)
      .cacheFetch(function (build, cached, cb) {
        if (keypather.get(build, 'attrs.started')) {
          // this build has been built.
          // redirect to new?
          $state.go('instance.new', {
            userName: $rootScope.dataApp.data.activeAccount.oauthId()
          });
          cb(new Error('build already built'));
        } else {
          data.build = build;
          cb();
        }
      })
      .resolve(cb)
      .go();
  }

  var unwatchInstances = $rootScope.$watch('dataApp.data.instances', function (n) {
    data.instances = n;
  });

  $scope.$on('$destroy', function () {
    unwatchInstances();
  });
  async.waterfall([
    function (cb) {
      fetchUser(function(err, user) {
        if (err) { return cb(err); }
        data.user = user;
        cb();
      });
    },
    fetchBuild
  ], errs.handler);

}
