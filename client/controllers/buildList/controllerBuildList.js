var app  = require('app');
var $   = require('jquery');
var deps = [
  '$scope',
  'user',
  '$stateParams',
  'async',
  '$window'
];
deps.push(ControllerBuildList);
app.controller('ControllerBuildList', deps);
function ControllerBuildList ($scope,
                              user,
                              $stateParams,
                              async,
                              $window) {
  var dataBuildList = $scope.dataBuildList = {};

  dataBuildList.togglePopover = function (popoverName, eventA) {
    if (dataBuildList['show' + popoverName]) {
      eventA.stopPropagation();
      return;
    }
    dataBuildList['show' + popoverName] = true;
    // prevent popover from minimizing when clicking inside popover
    var $elPopover = $(eventA.currentTarget).parent('li.btn').children('.popover');
    $elPopover.off('click').on('click', function (eventC) {
      if ($(this).has($(eventC.target))) {
        eventC.stopPropagation();
      }
    });
    // setTimeout prevents callback registered below from firing for THIS click event
    // (we want it to fire on the next click instead)
    setTimeout(function () {
      $(window).one('click', function (eventB) {
        $scope.$apply(function () {
          dataBuildList['show' + popoverName] = false;
        });
      });
    }, 1);
  };

  async.waterfall([
    // temporary helper
    function tempHelper (cb) {
      if (user.id()) {
        cb();
      } else {
        user.anonymous(cb);
      }
    },
    //-------
    function fetchProject (cb) {
      var projects = user.fetchProjects({
        ownerUsername: $stateParams.ownerUsername,
        name:          $stateParams.name
      }, function (err, body) {
        if (err) {
          // error handling
          return cb(err);
        }
        cb(null, projects.models[0]);
      });
    },
    function fetchEnvironment (project, cb) {
      // TODO error check
      var environmentJSON = project.toJSON().environments.filter(hasProps({name: 'master'}))[0];
      var environment = project.newEnvironment(environmentJSON);
      cb(null, project, environment);
    },
    function fetchBuilds (project, environment, cb) {
      var builds = environment.fetchBuilds(function (err) {
        if (err) return cb(err); //TODO error handling
        cb(null, project, environment, builds);
      });
    }
  ], function (err, project, environment, builds) {
    if (err) return; // TODO error handling
    dataBuildList.project     = project;
    dataBuildList.environment = environment;
    dataBuildList.builds      = builds;
  });
}