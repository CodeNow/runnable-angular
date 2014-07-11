require('app')
  .controller('ControllerInstance', ControllerInstance);
/**
 * ControllerInstance
 * @constructor
 * @export
 * @ngInject
 */
function ControllerInstance(
  $scope,
  async,
  $stateParams,
  user
) {
  var dataInstance = $scope.dataInstance = {};

  // init
  dataInstance.popoverAddTab = {
    filter: ''
  };

  dataInstance.showAddTab = false;
  dataInstance.showFileMenu = false;

  $scope.$on('app-document-click', function () {
    dataInstance.showAddTab = false;
    dataInstance.showFileMenu = false;
    dataInstance.popoverAddTab.filter = '';
  });

  dataInstance.togglePopover = function (popoverName, event) {
    event.stopPropagation();
    dataInstance.showAddTab = false;
    dataInstance.showFileMenu = false;
    dataInstance['show' + popoverName] = true;
  };

  async.waterfall([

    function tempHelper(cb) {
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
