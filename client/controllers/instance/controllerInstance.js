var app  = require('app');
var deps = [
  '$scope',
  'async',
  '$stateParams',
  'user'
];
deps.push(ControllerInstance);
app.controller('ControllerInstance', deps);
function ControllerInstance ($scope,
                             async,
                             $stateParams,
                             user) {
  var dataInstance = $scope.dataInstance = {};
  async.waterfall([
    function tempHelper (cb) {
      if (user.id()) {
        
      }
    },
    function (cb) {
      var instance = user.fetchInstance($stateParams.instanceId, function () {
        cb(null, instance);
      });
    },
    function (instance, cb) {

    }
  ], function (err, results) {

  });
}