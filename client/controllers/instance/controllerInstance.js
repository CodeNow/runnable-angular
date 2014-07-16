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

  dataInstance.tabs = [
    {
      title: 'dockerfile',
      path: '~/full/path/dockerfile',
      type: 'file',
      active: true
    },
    {
      title: 'main.config',
      path: '~/full/path/main.config',
      type: 'file'
    },
    {
      title: 'Terminal',
      path: 'Terminal',
      type: 'terminal'
    }
  ];
  
  // TODO
  dataInstance.closeTab = angular.noop;
  
  dataInstance.setActiveTab = function(tab) {
    dataInstance.tabs.forEach(function(tab) {
      tab.active = false;
    });
    tab.active = true;
    dataInstance.activePanel = tab.type;
  };
  
  dataInstance.setActiveTab(dataInstance.tabs[0]);

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
