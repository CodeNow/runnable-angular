require('app')
  .controller('ControllerInstanceEdit', ControllerInstanceEdit);
/**
 * @ngInject
 */
function ControllerInstanceEdit(
  async,
  $interval,
  keypather,
  errs,
  OpenItems,
  QueryAssist,
  fetchUser,
  $scope,
  $state,
  $stateParams,
  $timeout,
  $log,
  user,
  $window
) {

  var dataInstanceEdit = $scope.dataInstanceEdit = {
    data: {},
    actions: {}
  };
  var data = dataInstanceEdit.data;
  var actions = dataInstanceEdit.actions;

  data.openItems = new OpenItems();

  data.loading = false;
  data.showExplorer = false;

  function fetchInstance(cb) {
    new QueryAssist($scope.user, cb)
      .wrapFunc('fetchInstances')
      .query({
        githubUsername: $stateParams.userName,
        name: $stateParams.instanceName
      })
      .cacheFetch(function (instances, cached, cb) {
        var instance = instances.models[0];
        data.instance = instance;
        data.instance.state = {};
        cb();
      })
      .resolve(function (err, instances, cb) {
        if (!instances.models.length) {
          return cb(new Error('Instance not found'));
        }
        if (err) { throw err; }
        var instance = instances.models[0];
        data.instance = instance;
        data.instance.state = {};
        cb();
      })
      .go();
  }

  function fetchBuild(cb) {
    new QueryAssist($scope.user, cb)
      .wrapFunc('fetchBuild')
      .query($stateParams.buildId)
      .cacheFetch(function (build, cached, cb) {
        if (build.attrs.completed) {
          $state.go('instance.instance', $stateParams);
          return cb(null, true);
        }
        $scope.build = build;
        cb();
      })
      .resolve(function (err, build, cb) {
        if (err) { throw err; }
        cb();
      })
      .go();
  }

  // This is to fetch the list of instances.  This is separate so the page can load quickly
  // since it will have its instance.  Only the modals use this list
  function fetchInstances(cb) {
    new QueryAssist($scope.user, cb)
      .wrapFunc('fetchInstances', cb)
      .query({
        githubUsername: $stateParams.userName
      })
      .cacheFetch(function (instances, cached, cb) {
        if (!cached && instances.models.length === 0) {
          throw new Error('instance not found');
        }
        data.instances = instances;
        cb();
      })
      .resolve(function (err, instances, cb) {
        if (err) { return $log.error(err); }
        data.instances = instances;
        cb();
      })
      .go();
  }

  // open "Dockerfile" build file by default
  function setDefaultTabs() {
    var rootDir = keypather.get($scope, 'build.contextVersions.models[0].rootDir');
    if (!rootDir) { throw new Error(); }
    rootDir.contents.fetch(function(err) {
      if (err) { throw err; }
      var file = rootDir.contents.models.find(function(file) {
        return (file.attrs.name === 'Dockerfile');
      });
      if (file) {
        data.openItems.add(file);
      }
    });
  }

  async.waterfall([
    function (cb) {
      fetchUser(function (err, user) {
        $scope.user = user;
        cb();
      });
    },
    fetchInstance,
    fetchBuild
  ], function(err, redirect) {
    if (err) { return errs.handler(err); }
    if (redirect) { return; }
    setDefaultTabs();
    fetchInstances(angular.noop);
  });

}
