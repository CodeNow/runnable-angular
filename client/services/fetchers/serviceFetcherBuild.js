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
  $stateParams,
  exists,
  hasKeypaths
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
          var project = data.project = projects.models[0];
          data.environment = exists($stateParams.branchName) ?
            project.environments.find(
              hasKeypaths({ 'attrs.name.toLowerCase()': $stateParams.branchName })):
            project.defaultEnvironment;
          if (!data.environment) {
             $state.go('404');
          }
          $rootScope.safeApply();
        })
        .resolve(function (err, projects, cb) {
          if (err) {
            throw err;
          }
          else if (!projects.models.length) {
            $state.go('404');
          }
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
          if (err) {
            throw err;
          }
          $rootScope.safeApply();
          cb();
       })
        .go();
    }

    return function (cb) {
      async.series([
        $rootScope.UTIL.holdUntilAuth,
        fetchProject,
        fetchBuild
      ], cb);
    };

  };
}
