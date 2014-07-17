require('app')
  .controller('ControllerProjectLayout', ControllerProjectLayout);
/**
 * ControllerProjectLayout
 * @constructor
 * @export
 * @ngInject
 */
function ControllerProjectLayout(
  $scope,
  async,
  $state,
  $stateParams,
  user,
  keypather
) {
  var QueryAssist = $scope.UTIL.QueryAssist;
  var self = ControllerProjectLayout;
  var dataProjectLayout = $scope.dataProjectLayout = self.initState();
  var data = dataProjectLayout.data,
      actions = dataProjectLayout.actions;

  actions.getInClass = function () {
    return ($state.current.name === 'projects') ? 'in' : '';
  };
  actions.getProjectBuildListHref = function (projectName) {
    return '/' + $state.params.userName + '/' + projectName + '/master/';
  };
  actions.getProjectLiClass = function (project) {
    return (project.attrs.name === $state.params.projectName) ? 'active' : '';
  };
  actions.createNewApp = function () {
    function createProject(thisUser, cb) {
      var project = thisUser.createProject({
        name: dataProjectLayout.data.newAppName,
        dockerfile: 'FROM ubuntu\n'
      }, function (err) {
        cb(err, thisUser, project);
      });
    }
    async.waterfall([
      $scope.dataApp.holdUntilAuth,
      createProject
    ], function (err, thisUser, project) {
      $state.go('projects.setup', {
        userName: thisUser.attrs.username,
        projectName: project.attrs.name
      });
    });
  };
  actions.stateToBuildList = function () {
    var project, environment, event;
    project = arguments[0];
    if (arguments.length == 2) { // project, $event
      event = arguments[1];
    } else { // project, environment, $event
      environment = arguments[1];
      event = arguments[2];
    }
    if (angular.isFunction(keypather.get(event, 'stopPropagation'))) {
      event.stopPropagation();
    }
    $state.go('projects.buildList', {
      userName: $scope.dataApp.user.attrs.username,
      projectName: project.attrs.name,
      branchName: ((environment) ? environment.name : 'master')
    });
  };

  /* ============================
   *   API Fetch Methods
   * ===========================*/
  function checkAuth(thisUser, cb){
    // TODO
    cb(null, thisUser);
  }
  function fetchProjects(thisUser, cb){
    new QueryAssist(thisUser, cb)
      .wrapFunc('fetchProjects')
      .query({
        ownerUsername: $scope.dataApp.stateParams.userName
      })
      .cacheFetch(function updateDom(projects, cached, cb){
        dataProjectLayout.data.projects = projects;
        $scope.safeApply();
        cb();
      })
      .resolve(function(err, projects, cb){
        $scope.safeApply();
        cb();
      })
      .go();
  }
  actions.initForState = function(){
    async.waterfall([
      $scope.dataApp.holdUntilAuth,
      checkAuth,
      fetchProjects
    ], function(err){});
  };

  $scope.$watch('dataApp.state.current.name', function (newval, oldval) {
    if (newval === 'projects.buildList') {
      actions.initForState();
    } else if (newval === 'projects') {
      // send user home if here and not logged in
      $scope.dataApp.holdUntilAuth();
    }
  });
}

ControllerProjectLayout.initState = function () {
  return {
    data: {
      showChangeAccount: false,
      newAppName: ''
    },
    actions: {}
  };
};
