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
  
  var self = ControllerInstance;
  var dataInstance = $scope.dataInstance = self.initData();
  var data = dataInstance.data,
      actions = dataInstance.actions;

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
  
  dataInstance.closeTab = function(idx) {
    dataInstance.tabs = dataInstance.tabs.slice(0, idx).concat(dataInstance.tabs.slice(idx + 1));
  };
  
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
    dataInstance.data.showAddTab = false;
    dataInstance.data.showFileMenu = false;
    dataInstance.data.popoverAddTab.filter = '';
  });
}

ControllerInstance.initData = function () {
  return {
    data: {
      popoverAddTab: {
        filter: ''
      },
      showAddTab: false,
      showFileMenu: false
    },
    actions: {}
  };
};
