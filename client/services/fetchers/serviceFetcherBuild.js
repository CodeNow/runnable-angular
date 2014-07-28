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
          var project = data.project = projects.models[0];
          data.environment = exists($stateParams.branchName) ?
            find(project.environments.models,
              hasKeypaths({ 'name.toLowerCase()': $stateParams.branchName })):
            project.defaultEnvironment;
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
        fetchBuild
      ], cb);
    };

  };
}
