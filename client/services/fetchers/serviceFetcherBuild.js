require('app')
  .factory('fetcherBuild', factoryFetcherBuild);
/**
 * factory fetcherBuild
 * @ngInject
 */
function factoryFetcherBuild (
  user,
  async,
  QueryAssist,
  $rootScope,
  $state,
  $stateParams
) {

  return function (
    data
  ) {

    function fetchProject(cb) {
      var thisUser = $rootScope.dataApp.user;
      new QueryAssist(thisUser, cb)
        .wrapFunc('fetchProjects')
        .query({
          ownerUsername: $stateParams.userName,
          name: $stateParams.projectName
        })
        .cacheFetch(function updateDom(projects, cached, cb) {
          data.project = projects.models[0];
          $rootScope.safeApply();
        })
        .resolve(function (err, projects, cb) {
          if (err || !projects.length) {
          //  $state.go('404');
          }
          $rootScope.safeApply();
          cb();
        })
        .go();
    }

    function fetchEnvironment(cb) {
      new QueryAssist(data.project, cb)
        .wrapFunc('fetchEnvironments')
        .query({
          ownerUsername: $stateParams.userName,
          name: $stateParams.branchName
        })
        .cacheFetch(function updateDom(environments, cached, cb) {
          data.environment = environments.models[0];
          $rootScope.safeApply();
          cb();
        })
        .resolve(function (err, environments, cb) {
          $rootScope.safeApply();
          cb();
        })
        .go();
    }

    function fetchBuild(cb) {
      new QueryAssist(data.environment, cb)
        .wrapFunc('fetchBuilds')
        .query({
          buildNumber: $stateParams.buildName,
          environment: data.environment.id()
        })
        .cacheFetch(function updateDom(builds, cached, cb) {
          if (!builds.models.length) {
            actions.stateToBuildList();
          }
          else {
            var build = builds.models[0];
            data.build = build;
            data.version = build.contextVersions.models[0];
            $rootScope.safeApply();
            if (build.attrs.contextVersions.length){
              cb();
            }
          }
        })
        .resolve(function (err, builds, cb) {
          $rootScope.safeApply();
          cb();
       })
        .go();
    }

    return function (cb) {
      async.series([
        $rootScope.UTIL.holdUntilAuth,
        fetchProject,
        fetchEnvironment,
        fetchBuild
      ], cb);
    };

  };
}
