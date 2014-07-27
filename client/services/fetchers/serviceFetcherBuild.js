require('app')
  .factory('fetcherBuild', fetcherBuild);
/**
 * factory fetcherBuild
 * @ngInject
 */
function fetcherBuild (
  user,
  async,
  QueryAssist
) {

  return function (thisUser, $scope) {

    function fetchProject(cb) {
      new QueryAssist(thisUser, cb)
        .wrapFunc('fetchProjects')
        .query({
          ownerUsername: $stateParams.userName,
          name: $stateParams.projectName
        })
        .cacheFetch(function updateDom(projects, cached, cb) {
          dataBuild.data.project = projects.models[0];
          $scope.safeApply();
          cb();
        })
        .resolve(function (err, projects, cb) {
          if (err) {
            // TODO
            // 404
          }
          $scope.safeApply();
          cb();
        })
        .go();
    }

    function fetchEnvironment(cb) {
      new QueryAssist(dataBuild.data.project, cb)
        .wrapFunc('fetchEnvironments')
        .query({
          ownerUsername: $stateParams.userName,
          name: $stateParams.branchName
        })
        .cacheFetch(function updateDom(environments, cached, cb) {
          dataBuild.data.environment = environments.models[0];
          $scope.safeApply();
          cb();
        })
        .resolve(function (err, environments, cb) {
          $scope.safeApply();
          cb();
        })
        .go();
    }

    function fetchBuild(cb) {
      new QueryAssist(dataBuild.data.environment, cb)
        .wrapFunc('fetchBuild')
        .query($stateParams.buildName)
        .cacheFetch(function updateDom(build, cached, cb) {
          dataBuild.data.build = build;
          dataBuild.data.version = build.contextVersions.models[0];
          $scope.safeApply();
          if (build.attrs.contextVersions.length){
            cb();
          }
        })
        .resolve(function (err, build, cb) {
          $scope.safeApply();
          cb();
        })
        .go();
    }

  };
}
