var app = require('app');
app.controller('ControllerBuild', [
  '$scope',
  'user',
  'ensureAnonymous',
  function ($scope,
            user,
            ensureAnonymous) {

    var dataBuild = {};
    $scope.dataBuild = dataBuild;

    dataBuild.commits = [{
      message: 'syncing with Tony',
      username: 'cflynn07',
      datetime: new Date(Date.now() - Math.ceil(Math.random() * 100000000000))
    },{
      message: 'removing comment',
      username: 'cflynn07',
      datetime: new Date(Date.now() - Math.ceil(Math.random() * 100000000000))
    }];


    ensureAnonymous(user, function (err) {
      if (err) return;
    });

    // user.anonymous(function () {
    // });

    // projects = api.fetchProjects(function () {
    //   projects.models[0].fetchEnvironments(function () {

    //   });
    // });

}]);