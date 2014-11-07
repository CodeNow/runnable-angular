require('app')
  .controller('ControllerInstanceEdit', ControllerInstanceEdit);
/**
 * @ngInject
 */
function ControllerInstanceEdit(
  async,
  $interval,
  keypather,
  OpenItems,
  QueryAssist,
  $scope,
  $state,
  $stateParams,
  $timeout,
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

  function fetchUser(cb) {
    new QueryAssist(user, cb)
      .wrapFunc('fetchUser')
      .query('me')
      .cacheFetch(function (user, cached, cb) {
        $scope.user = user;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, user, cb) {})
      .go();
  }

  function fetchBuild(cb) {
    new QueryAssist($scope.user, cb)
      .wrapFunc('fetchBuild')
      .query($stateParams.buildId)
      .cacheFetch(function (build, cached, cb) {
        $scope.build = build;
        $scope.safeApply();
        cb();
      })
      .resolve(function (err, build, cb) {
        if (err) throw err;
        $scope.safeApply();
        cb();
      })
      .go();
  }

  // open "Dockerfile" build file by default
  function setDefaultTabs() {
    var rootDir = keypather.get($scope, 'build.contextVersions.models[0].rootDir');
    if (!rootDir) throw new Error();
    rootDir.contents.fetch(function(err) {
      if (err) throw err;
      var file = rootDir.contents.models.find(function(file) {
        return (file.attrs.name === 'Dockerfile');
      });
      if (file) {
        data.openItems.add(file);
      }
    });
  }

  async.series([
    fetchUser,
    fetchBuild
  ], function(err) {
    if (err) throw err;
    setDefaultTabs();
  });

}
